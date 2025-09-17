import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';
import { EmployeeWorkHoursService } from '../../services/employee-work-hours.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { workHoursAnimations } from './employee-work-hours.animations';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface WorkSession {
  id: number;
  employee: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed';
  total_work_time?: string;
  pause_start_time?: string;
  total_pause_time?: string;
  notes?: string;
}

interface SessionStats {
  total_hours: number;
  pause_hours: number;
  net_hours: number;
  efficiency: number;
}

@Component({
  selector: 'app-employee-work-hours',
  templateUrl: './employee-work-hours.component.html',
  styleUrls: ['./employee-work-hours.component.css'],
  animations: workHoursAnimations,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EmployeeWorkHoursComponent implements OnInit, OnDestroy {
  @ViewChild('sessionCard') sessionCard!: ElementRef;
  @ViewChild('timerDisplay') timerDisplay!: ElementRef;

  // Formulaires
  sessionForm: FormGroup;
  pauseForm: FormGroup;

  // États
  currentSession: WorkSession | null = null;
  isSessionActive = false;
  employeeWorkStats: any[] = [];
  isPaused = false;
  isLoading = false;
  showSessionModal = false;
  showPauseModal = false;
  showStatsModal = false;

  // Données
  sessions: WorkSession[] = [];
  filteredSessions: WorkSession[] = [];
  sessionStats: SessionStats = {
    total_hours: 0,
    pause_hours: 0,
    net_hours: 0,
    efficiency: 0
  };

  // Timer et animations
  private destroy$ = new Subject<void>();
  private timerInterval: any;
  currentTime = new Date();
  sessionDuration = 0;
  pauseDuration = 0;

  // Filtres et recherche
  searchTerm = '';
  statusFilter = 'all';
  dateFilter = 'today';

  // Propriétés pour la modal de détails employé
  showEmployeeDetailsModal: boolean = false;
  selectedEmployeeForDetails: any = null;

  // Propriétés pour les filtres temporels
  selectedTimePeriod: 'day' | 'week' | 'month' = 'day';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Animations
  cardAnimationState = 'idle';
  timerAnimationState = 'running';

  // Notifications
  notifications: Array<{type: 'success' | 'warning' | 'error', message: string}> = [];

  constructor(
    private fb: FormBuilder,
    private workHoursService: EmployeeWorkHoursService,
    private authService: AuthService,
    private socketService: SocketService,
    private http: HttpClient
  ) {
    this.sessionForm = this.fb.group({
      notes: ['', Validators.maxLength(500)],
      project: [''],
      task: ['']
    });

    this.pauseForm = this.fb.group({
      reason: ['', Validators.required],
      estimated_duration: [15, [Validators.min(1), Validators.max(120)]]
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.startTimer();
    this.loadCurrentSession();
    this.loadEmployeeWorkStats();
    this.setupSocketListeners();

    // Mettre à jour les statistiques toutes les 5 minutes
    interval(300000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateStats();
      this.loadEmployeeWorkStats();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // === GESTION SOCKET.IO ===

  private setupSocketListeners(): void {
    // Écouter les mises à jour de sessions de travail
    this.socketService.getWorkSessionUpdates().pipe(takeUntil(this.destroy$)).subscribe(update => {
      if (update) {
        this.handleWorkSessionUpdate(update);
      }
    });

    // Écouter les mises à jour de statut de session
    this.socketService.getSessionStatusUpdates().pipe(takeUntil(this.destroy$)).subscribe(update => {
      if (update) {
        this.handleSessionStatusUpdate(update);
      }
    });

    // Écouter les mises à jour des statistiques admin
    this.socketService.getAdminStatsUpdates().pipe(takeUntil(this.destroy$)).subscribe(stats => {
      if (stats) {
        this.handleAdminStatsUpdate(stats);
      }
    });
  }

  private handleWorkSessionUpdate(update: any): void {
    console.log('🔄 Mise à jour session reçue:', update);
    
    // Recharger les données pour avoir les informations à jour
    this.loadEmployeeWorkStats();
    this.loadSessions();
    
    // Afficher une notification selon le type d'événement
    switch (update.type) {
      case 'session_started':
        this.addNotification('success', `${update.data.employee_email} a démarré une session`);
        break;
      case 'session_paused':
        this.addNotification('warning', `${update.data.employee_email} a mis sa session en pause`);
        break;
      case 'session_resumed':
        this.addNotification('success', `${update.data.employee_email} a repris sa session`);
        break;
      case 'session_ended':
        this.addNotification('success', `${update.data.employee_email} a terminé sa session`);
        break;
    }
  }

  private handleSessionStatusUpdate(update: any): void {
    console.log('📊 Mise à jour statut session:', update);
    // Recharger les statistiques pour l'employé concerné
    this.loadEmployeeWorkStats();
  }

  private handleAdminStatsUpdate(stats: any): void {
    console.log('📈 Mise à jour statistiques admin:', stats);
    // Mettre à jour les statistiques globales
    this.sessionStats = {
      total_hours: stats.active_sessions || 0,
      pause_hours: 0,
      net_hours: stats.active_sessions || 0,
      efficiency: 100
    };
  }

  // === GESTION DES SESSIONS ===

  startSession(): void {
    if (this.sessionForm.valid) {
      this.isLoading = true;
      this.workHoursService.startSession(this.sessionForm.value).subscribe({
        next: (session) => {
          this.currentSession = session;
          this.isSessionActive = true;
          this.isPaused = false;
          this.showSessionModal = false;
          this.sessionForm.reset();
          this.loadCurrentSession();
          this.addNotification('success', 'Session de travail démarrée avec succès !');
          this.animateCard('start');
          
          // Notifier via Socket.IO
          this.socketService.notifySessionStarted({
            session_id: session.id,
            start_time: session.start_time,
            notes: session.notes || ''
          });
        },
        error: (error) => {
          this.addNotification('error', 'Erreur lors du démarrage de la session');
          console.error('Erreur start session:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  pauseSession(): void {
    if (this.pauseForm.valid && this.currentSession) {
      this.isLoading = true;
      this.workHoursService.pauseSession(this.currentSession.id, this.pauseForm.value).subscribe({
        next: () => {
          this.isPaused = true;
          this.showPauseModal = false;
          const pauseData = this.pauseForm.value;
          this.pauseForm.reset();
          this.addNotification('warning', 'Session mise en pause');
          this.animateCard('pause');
          this.updateStats();
          
          // Notifier via Socket.IO
          if (this.currentSession) {
            this.socketService.notifySessionPaused({
              session_id: this.currentSession.id,
              reason: pauseData.reason,
              pause_start: new Date().toISOString()
            });
          }
        },
        error: (error) => {
          this.addNotification('error', 'Erreur lors de la mise en pause');
          console.error('Erreur pause session:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  resumeSession(): void {
    if (!this.currentSession) return;
    this.isLoading = true;
    this.workHoursService.resumeSession(this.currentSession.id).subscribe({
        next: () => {
          this.isPaused = false;
          this.addNotification('success', 'Session reprise avec succès !');
          this.animateCard('resume');
          this.updateStats();
          
          // Notifier via Socket.IO
          if (this.currentSession) {
            this.socketService.notifySessionResumed({
              session_id: this.currentSession.id,
              resume_time: new Date().toISOString()
            });
          }
        },
      error: (error) => {
        this.addNotification('error', 'Erreur lors de la reprise');
        console.error('Erreur resume session:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  endSession(): void {
    if (!this.currentSession) return;
    this.isLoading = true;
    this.workHoursService.endSession(this.currentSession.id).subscribe({
        next: () => {
          const sessionData = {
            session_id: this.currentSession?.id,
            end_time: new Date().toISOString(),
            total_work_time: this.currentSession?.total_work_time,
            total_pause_time: this.currentSession?.total_pause_time
          };
          
          this.isSessionActive = false;
          this.currentSession = null;
          this.addNotification('success', 'Session terminée avec succès !');
          this.animateCard('end');
          this.loadSessions();
          this.updateStats();
          
          // Notifier via Socket.IO
          this.socketService.notifySessionEnded(sessionData);
        },
      error: (error) => {
        this.addNotification('error', 'Erreur lors de la terminaison');
        console.error('Erreur end session:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // === TIMER ET ANIMATIONS ===

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
      if (this.currentSession && this.isSessionActive && !this.isPaused) {
        this.sessionDuration++;
        this.animateTimer();
      }
      if (this.isPaused) {
        this.pauseDuration++;
      }
    }, 1000);
  }

  private animateTimer(): void {
    if (this.timerDisplay) {
      this.timerAnimationState = this.timerAnimationState === 'running' ? 'pulse' : 'running';
    }
  }

  private animateCard(action: 'start' | 'pause' | 'resume' | 'end'): void {
    this.cardAnimationState = action;
    setTimeout(() => {
      this.cardAnimationState = 'idle';
    }, 1000);
  }

  // === GESTION DES DONNÉES ===

  loadSessions(): void {
    this.isLoading = true;
    this.workHoursService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.filteredSessions = sessions;
        this.updateStats();
        this.applyFilters();
      },
      error: (error) => {
        this.addNotification('error', 'Erreur lors du chargement des sessions');
        console.error('Erreur load sessions:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadCurrentSession(): void {
    this.workHoursService.getCurrentSession().subscribe({
      next: (session) => {
        if (session) {
          this.currentSession = session;
          this.isSessionActive = session.status === 'active';
          this.isPaused = session.status === 'paused';
          this.calculateSessionDuration();
        }
      },
      error: (error) => {
        console.error('Erreur load current session:', error);
      }
    });
  }

  private calculateSessionDuration(): void {
    if (this.currentSession) {
      const start = new Date(this.currentSession.start_time);
      const now = new Date();
      this.sessionDuration = Math.floor((now.getTime() - start.getTime()) / 1000);
    }
  }

  // === FILTRES ET RECHERCHE ===

  applyFilters(): void {
    let filtered = this.sessions;

    // Filtre par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    // Filtre par date
    const now = new Date();
    switch (this.dateFilter) {
      case 'today':
        filtered = filtered.filter(s => {
          const sessionDate = new Date(s.start_time);
          return sessionDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => new Date(s.start_time) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => new Date(s.start_time) >= monthAgo);
        break;
    }

    // Filtre par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(s =>
        s.employee.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.notes?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredSessions = filtered;
    this.currentPage = 1;
  }

  // === PAGINATION ===

  get paginatedSessions(): WorkSession[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSessions.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSessions.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // === STATISTIQUES ===

  private updateStats(): void {
    if (this.sessions.length > 0) {
      const totalSeconds = this.sessions.reduce((acc, session) => {
        if (session.total_work_time) {
          return acc + this.parseDurationToHours(session.total_work_time);
        }
        return acc;
      }, 0);

      const pauseSeconds = this.sessions.reduce((acc, session) => {
        if (session.total_pause_time) {
          return acc + this.parseDurationToHours(session.total_pause_time);
        }
        return acc;
      }, 0);

      this.sessionStats = {
        total_hours: totalSeconds / 3600,
        pause_hours: pauseSeconds / 3600,
        net_hours: (totalSeconds - pauseSeconds) / 3600,
        efficiency: totalSeconds > 0 ? ((totalSeconds - pauseSeconds) / totalSeconds) * 100 : 0
      };
    }
  }

  // === MÉTHODES POUR LE TABLEAU DES EMPLOYÉS ===

  // Méthodes pour les nouvelles colonnes
  getEmployeeName(session: any): string {
    return session.employee?.full_name || session.employee?.user?.first_name + ' ' + session.employee?.user?.last_name || 'N/A';
  }

  getEmployeeMatricule(session: any): string {
    return session.employee?.matricule || 'N/A';
  }

  getEmployeeWorkStats(session: any): any {
    const employeeId = session.employee?.id;
    return this.employeeWorkStats.find(stat => stat.employee_id === employeeId) || {};
  }

  getDailyProgressPercentage(session: any): number {
    const stats = this.getEmployeeWorkStats(session);
    const hoursWorked = stats?.today_worked_hours || stats?.total_hours_today || 0;
    return Math.min((hoursWorked / 8) * 100, 100);
  }

  getDailyProgressPercentageFromStats(stats: any): number {
    const hoursWorked = stats?.today_worked_hours || stats?.total_hours_today || 0;
    return Math.min((hoursWorked / 8) * 100, 100);
  }

  getSessionStatusClass(session: any): string {
    const stats = this.getEmployeeWorkStats(session);
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'session-active';
      case 'paused': return 'session-paused';
      default: return 'session-none';
    }
  }

  getSessionStatusClassFromStats(stats: any): string {
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'session-active';
      case 'paused': return 'session-paused';
      default: return 'session-none';
    }
  }

  getSessionStatusIcon(session: any): string {
    const stats = this.getEmployeeWorkStats(session);
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'play_circle';
      case 'paused': return 'pause_circle';
      default: return 'stop_circle';
    }
  }

  getSessionStatusIconFromStats(stats: any): string {
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'fa-play-circle';
      case 'paused': return 'fa-pause-circle';
      default: return 'fa-stop-circle';
    }
  }

  getSessionStatusLabel(session: any): string {
    const stats = this.getEmployeeWorkStats(session);
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'En cours';
      case 'paused': return 'En pause';
      default: return 'Arrêtée';
    }
  }

  getSessionStatusLabelFromStats(stats: any): string {
    const status = stats?.current_session_status;

    switch (status) {
      case 'active': return 'En cours';
      case 'paused': return 'En pause';
      default: return 'Arrêtée';
    }
  }


  viewEmployeeDetails(stats: any): void {
    console.log('Voir détails employé:', stats);
    this.selectedEmployeeForDetails = stats;
    this.showEmployeeDetailsModal = true;
  }

  closeEmployeeDetailsModal(): void {
    this.showEmployeeDetailsModal = false;
    this.selectedEmployeeForDetails = null;
  }

  setTimePeriod(period: 'day' | 'week' | 'month'): void {
    this.selectedTimePeriod = period;
    console.log(`📊 Période sélectionnée: ${period}`);
    // Mettre à jour l'affichage selon la période sélectionnée
    this.updateTableDisplay();
  }

  updateTableDisplay(): void {
    // Cette méthode peut être étendue pour modifier l'affichage des données
    // selon la période sélectionnée (jour/semaine/mois)
    console.log(`📊 Mise à jour de l'affichage pour la période: ${this.selectedTimePeriod}`);
  }

  getDisplayedHours(stats: any): string {
    const hours = this.getDisplayedHoursValue(stats);
    return this.formatHoursMinutes(hours);
  }

  getDisplayedHoursValue(stats: any): number {
    switch (this.selectedTimePeriod) {
      case 'day':
        return stats.today_worked_hours || stats.total_hours_today || 0;
      case 'week':
        return stats.week_worked_hours || stats.total_hours_week || 0;
      case 'month':
        return stats.month_worked_hours || stats.total_hours_month || 0;
      default:
        return stats.today_worked_hours || stats.total_hours_today || 0;
    }
  }

  getDisplayedPauseHours(stats: any): string {
    const hours = this.getDisplayedPauseHoursValue(stats);
    return this.formatHoursMinutes(hours);
  }

  getDisplayedPauseHoursValue(stats: any): number {
    switch (this.selectedTimePeriod) {
      case 'day':
        return stats.today_pause_hours || stats.total_pause_today || 0;
      case 'week':
        return stats.week_pause_hours || stats.total_pause_week || 0;
      case 'month':
        return stats.month_pause_hours || stats.total_pause_month || 0;
      default:
        return stats.today_pause_hours || stats.total_pause_today || 0;
    }
  }

  formatHoursMinutes(totalHours: number): string {
    if (!totalHours || totalHours === 0) return '0h 00m';
    
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    if (hours === 0) {
      return `${minutes.toString().padStart(2, '0')}m`;
    } else {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
  }

  // Nouvelle méthode pour formater les heures avec plus de détails
  formatDetailedHours(totalHours: number): string {
    if (!totalHours || totalHours === 0) return '0h 00m 00s';
    
    const hours = Math.floor(totalHours);
    const remainingMinutes = (totalHours - hours) * 60;
    const minutes = Math.floor(remainingMinutes);
    const seconds = Math.round((remainingMinutes - minutes) * 60);
    
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }

  // Méthode pour obtenir le pourcentage d'efficacité
  getEfficiencyPercentage(stats: any): number {
    const workedHours = stats?.today_worked_hours || stats?.total_hours_today || 0;
    const pauseHours = stats?.today_pause_hours || stats?.total_pause_today || 0;
    const totalHours = workedHours + pauseHours;
    
    if (totalHours === 0) return 0;
    return Math.round((workedHours / totalHours) * 100);
  }

  // Méthode pour obtenir le temps net travaillé
  getNetWorkHours(stats: any): number {
    const workedHours = stats?.today_worked_hours || stats?.total_hours_today || 0;
    const pauseHours = stats?.today_pause_hours || stats?.total_pause_today || 0;
    return Math.max(0, workedHours - pauseHours);
  }

  getPeriodLabel(): string {
    switch (this.selectedTimePeriod) {
      case 'day':
        return 'Aujourd\'hui';
      case 'week':
        return 'Cette semaine';
      case 'month':
        return 'Ce mois';
      default:
        return 'Aujourd\'hui';
    }
  }

  exportEmployeeData(stats: any): void {
    console.log('Exporter données employé:', stats);
    // Implémentation à ajouter selon les besoins
  }

  // === MÉTHODES UTILITAIRES ===

  addNotification(type: 'success' | 'warning' | 'error', message: string): void {
    this.notifications.push({ type, message });
    setTimeout(() => {
      this.removeNotification({ type, message });
    }, 5000);
  }

  removeNotification(notification: {type: 'success' | 'warning' | 'error', message: string}): void {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'play_circle';
      case 'paused': return 'pause_circle';
      case 'completed': return 'check_circle';
      default: return 'radio_button_unchecked';
    }
  }

  formatDateTime(dateTime: string | Date): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  parseDurationToHours(duration: string): number {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours + (minutes / 60) + (seconds / 3600);
  }

  // === MODALES ===

  openSessionModal(): void {
    this.showSessionModal = true;
    this.sessionForm.reset();
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
  }

  openPauseModal(): void {
    this.showPauseModal = true;
    this.pauseForm.reset();
  }

  closePauseModal(): void {
    this.showPauseModal = false;
  }

  openStatsModal(): void {
    this.showStatsModal = true;
  }

  closeStatsModal(): void {
    this.showStatsModal = false;
  }
  // === EXPORT ===

  exportSessions(): void {
    this.workHoursService.exportSessions().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sessions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.addNotification('success', 'Export réussi !');
      },
      error: (error) => {
        this.addNotification('error', 'Erreur lors de l\'export');
        console.error('Erreur export:', error);
      }
    });
  }

    // === UTILITAIRES SUPPLEMENTAIRES ===

  trackBySession(index: number, session: WorkSession): number {
    return session.id;
  }

  trackByEmployeeStats(index: number, stats: any): number {
    return stats.employee_id;
  }

  getInitials(stats: any): string {
    const name = stats.employee_name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // === CHARGEMENT DES STATISTIQUES ===

  loadEmployeeWorkStats(): void {
    console.log('🔄 Chargement des statistiques de travail...');
    this.isLoading = true;

    // Appeler l'API des statistiques de travail au lieu de tous les employés
    const apiUrl = `${environment.apiUrl}/api/employees/work-sessions/employee-stats/`;
    console.log('📡 URL appelée:', apiUrl);

    this.http.get(apiUrl).subscribe({
      next: (response: any) => {
        console.log('📥 Statistiques reçues:', response);
        this.isLoading = false;

        // Traiter les vraies statistiques de travail
        if (Array.isArray(response)) {
          // Afficher TOUS les employés (pas seulement ceux avec des sessions actives)
          this.employeeWorkStats = response;

          console.log(`✅ ${this.employeeWorkStats.length} employés actifs chargés`);

          if (this.employeeWorkStats.length === 0) {
            this.addNotification('warning', 'Aucun employé avec des sessions de travail actives');
          }
        } else {
          console.error('❌ Format de réponse non reconnu:', response);
          this.employeeWorkStats = [];
          this.addNotification('error', 'Format de données incorrect reçu de l\'API');
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur chargement employés:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);

        this.isLoading = false;
        this.employeeWorkStats = [];

        if (error.status === 401) {
          this.addNotification('error', 'Session expirée. Veuillez vous reconnecter.');
        } else if (error.status === 403) {
          this.addNotification('error', 'Accès non autorisé aux données des employés');
        } else if (error.status === 0) {
          this.addNotification('error', 'Problème de connexion au serveur');
        } else {
          this.addNotification('error', `Erreur lors du chargement des employés (${error.status})`);
        }
      }
    });
  }

  processSessionsToStats(sessions: any[]): any[] {
    const statsMap = new Map();

    sessions.forEach(session => {
      const employeeId = session.employee?.id;
      if (!employeeId) return;

      if (!statsMap.has(employeeId)) {
        statsMap.set(employeeId, {
          employee_id: employeeId,
          employee_name: session.employee.full_name,
          employee_email: session.employee.user?.email,
          employee_matricule: session.employee.matricule,
          today_worked_hours: 0,
          week_worked_hours: 0,
          month_worked_hours: 0,
          today_pause_hours: 0,
          week_pause_hours: 0,
          month_pause_hours: 0,
          current_session_status: session.status
        });
      }

      const stats = statsMap.get(employeeId);
      const workHours = this.parseDurationToHours(session.total_work_time || '0:00:00');
      const pauseHours = this.parseDurationToHours(session.total_pause_time || '0:00:00');

      // Ajouter aux totaux (simplification - en réalité il faudrait filtrer par date)
      stats.today_worked_hours += workHours;
      stats.week_worked_hours += workHours;
      stats.month_worked_hours += workHours;
      stats.today_pause_hours += pauseHours;
      stats.week_pause_hours += pauseHours;
      stats.month_pause_hours += pauseHours;
    });

    return Array.from(statsMap.values());
  }

  // Nouvelles méthodes pour l'interface améliorée
  getActiveSessionsCount(): number {
    return this.employeeWorkStats.filter(stats => 
      stats.current_session_status === 'active'
    ).length;
  }

  getPausedSessionsCount(): number {
    return this.employeeWorkStats.filter(stats => 
      stats.current_session_status === 'paused'
    ).length;
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadEmployeeWorkStats();
    this.loadSessions();
  }

  getCurrentSessionDuration(stats: any): string {
    // Placeholder implementation - should calculate actual duration
    return '2h 15m';
  }
}
