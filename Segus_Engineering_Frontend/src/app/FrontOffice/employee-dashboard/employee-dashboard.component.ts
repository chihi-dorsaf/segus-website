import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeFrontofficeService } from '../../services/employee-frontoffice.service';
import { WorkSessionService, WorkSession } from '../../services/work-session.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css']
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  dashboardData: any = null;
  currentSession: WorkSession | null = null;
  sessionTimer: string = '00:00:00';
  pauseTimer: string = '00:00:00';
  totalPause: string = '00:00:00';
  isLoading = true;
  error: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private employeeService: EmployeeFrontofficeService,
    private workSessionService: WorkSessionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupWorkSessionSubscriptions();
    this.autoStartWorkSession();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupWorkSessionSubscriptions(): void {
    const sessionSub = this.workSessionService.currentSession$.subscribe({
      next: (session) => {
        console.log('Session reçue dans le composant:', session);
        this.currentSession = session;
      },
      error: (error) => {
        console.error('Erreur dans la subscription session:', error);
      }
    });

    const timerSub = this.workSessionService.sessionTimer$.subscribe({
      next: (timer) => {
        console.log('Timer reçu dans le composant:', timer);
        this.sessionTimer = timer;
      },
      error: (error) => {
        console.error('Erreur dans la subscription timer:', error);
      }
    });

    const pauseSub = this.workSessionService.pauseTimer$.subscribe({
      next: (t) => (this.pauseTimer = t),
      error: (e) => console.error('Erreur pauseTimer$:', e)
    });

    const totalPauseSub = this.workSessionService.totalPause$.subscribe({
      next: (t) => (this.totalPause = t),
      error: (e) => console.error('Erreur totalPause$:', e)
    });

    this.subscriptions.push(sessionSub, timerSub, pauseSub, totalPauseSub);
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.employeeService.getDashboard().subscribe({
      next: (data: any) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  startWorkSession(): void {
    this.workSessionService.startSession().subscribe({
      next: (session) => {
        console.log('🚀 [Dashboard] Session de travail démarrée:', session);
        // Ne pas appeler loadCurrentSession() - la session est déjà mise à jour
      },
      error: (error) => {
        console.error('❌ [Dashboard] Erreur lors du démarrage de la session:', error);
      }
    });
  }

  pauseWorkSession(): void {
    if (this.currentSession) {
      this.workSessionService.pauseSession(this.currentSession.id!).subscribe({
        next: (session) => {
          console.log('⏸️ [Dashboard] Session mise en pause:', session);
          // Ne pas appeler loadCurrentSession() - la session est déjà mise à jour
        },
        error: (error) => {
          console.error('❌ [Dashboard] Erreur lors de la mise en pause:', error);
        }
      });
    }
  }

  resumeWorkSession(): void {
    if (this.currentSession) {
      this.workSessionService.resumeSession(this.currentSession.id!).subscribe({
        next: (session) => {
          console.log('▶️ [Dashboard] Session reprise:', session);
          // Ne pas appeler loadCurrentSession() - la session est déjà mise à jour
        },
        error: (error) => {
          console.error('❌ [Dashboard] Erreur lors de la reprise:', error);
        }
      });
    }
  }

  endWorkSession(): void {
    if (this.currentSession) {
      this.workSessionService.endSession(this.currentSession.id!).subscribe({
        next: (session) => {
          console.log('⏹️ [Dashboard] Session terminée:', session);
          // Ne pas appeler loadCurrentSession() - la session est déjà mise à jour
        },
        error: (error) => {
          console.error('❌ [Dashboard] Erreur lors de la fin de session:', error);
        }
      });
    }
  }

  // Méthode pour rafraîchir manuellement la session
  refreshSession(): void {
    console.log('🔄 [Dashboard] Rafraîchissement manuel de la session');
    // Remettre le timer à zéro
    this.sessionTimer = '00:00:00';
    // Recharger la session actuelle
    this.workSessionService.refreshCurrentSession();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'to_do': return 'secondary';
      default: return 'secondary';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  }

  getPerformanceColor(percentage: number): string {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getDaysRemainingText(days: number): string {
    if (days === null || days === undefined) return 'Pas de deadline';
    if (days < 0) return `${Math.abs(days)} jour(s) en retard`;
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Demain';
    return `${days} jour(s) restant(s)`;
  }

  getDaysRemainingClass(days: number): string {
    if (days === null || days === undefined) return 'text-muted';
    if (days < 0) return 'text-danger';
    if (days <= 3) return 'text-warning';
    return 'text-success';
  }

  // Méthode pour obtenir la couleur de la barre de progression
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  }

  // Méthode pour obtenir l'icône de l'activité
  getActivityIcon(type: string): string {
    switch (type) {
      case 'task': return 'fa-tasks';
      case 'project': return 'fa-project-diagram';
      case 'comment': return 'fa-comment';
      case 'update': return 'fa-edit';
      default: return 'fa-info-circle';
    }
  }

  // Méthode pour démarrer automatiquement le chronomètre
  private autoStartWorkSession(): void {
    // Attendre un peu pour que les subscriptions soient établies
    setTimeout(() => {
      // Vérifier s'il n'y a pas déjà une session active
      if (!this.currentSession) {
        console.log('🚀 [AutoStart] Démarrage automatique du chronomètre de travail');
        this.startWorkSession();
      } else {
        console.log('📋 [AutoStart] Session déjà active, pas de démarrage automatique nécessaire');
      }
    }, 1000);
  }

  // Méthodes de navigation
  navigateToTasks(): void {
    this.router.navigate(['/frontoffice/tasks']);
  }

  navigateToProjects(): void {
    this.router.navigate(['/frontoffice/projects']);
  }

  navigateToCalendar(): void {
    this.router.navigate(['/frontoffice/calendar']);
  }

  navigateToReports(): void {
    this.router.navigate(['/frontoffice/reports']);
  }

  // Actions sur les tâches
  markTaskComplete(taskId: number): void {
    console.log('Marquer la tâche comme terminée:', taskId);
    this.employeeService.updateTaskStatus(taskId, 'COMPLETED').subscribe({
      next: (response) => {
        console.log('Tâche marquée comme terminée:', response);
        // Recharger les données du dashboard
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
      }
    });
  }

  editTask(taskId: number): void {
    console.log('Modifier la tâche:', taskId);
    this.router.navigate(['/frontoffice/tasks', taskId, 'edit']);
  }

  // Actions sur les projets
  viewProject(projectId: number): void {
    console.log('Voir le projet:', projectId);
    this.router.navigate(['/frontoffice/projects', projectId]);
  }

  // Méthodes utilitaires pour l'affichage
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'todo': return 'À faire';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  }

  getPriorityText(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  }

  // Calculer les jours restants jusqu'à la deadline
  getDaysRemaining(deadline: string): number | null {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
