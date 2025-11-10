import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, interval, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';

export interface WorkSession {
  id?: number;
  employee: number;
  employee_name?: string;
  start_time: string;
  end_time?: string;
  total_work_time?: string;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  duration_formatted?: string;
  created_at: string;
  updated_at: string;
  // Ajouter des champs pour gérer les pauses
  pause_start_time?: string;
  total_pause_time?: string;
  accumulated_work_time?: string;
}

export interface EmployeeWorkStats {
  employee_id: number;
  employee_name: string;
  total_hours_today: number;
  total_hours_week: number;
  total_hours_month: number;
  current_session_status: string;
  current_session_start?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkSessionService {
  private apiUrl = `${environment.apiUrl}/api/employees/work-sessions/`;
  private statsUrl = `${environment.apiUrl}/api/employees/work-stats/`;

  private currentSessionSubject = new BehaviorSubject<WorkSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private sessionTimerSubject = new BehaviorSubject<string>('00:00:00');
  public sessionTimer$ = this.sessionTimerSubject.asObservable();

  // Pause timers (segment en cours et total de la session)
  private pauseTimerSubject = new BehaviorSubject<string>('00:00:00');
  public pauseTimer$ = this.pauseTimerSubject.asObservable();

  private totalPauseSubject = new BehaviorSubject<string>('00:00:00');
  public totalPause$ = this.totalPauseSubject.asObservable();

  private timerInterval: any;
  private sessionStartTime: Date | null = null;
  private pauseTimerInterval: any;
  private pauseStartTime: Date | null = null;
  private accumulatedPauseMs: number = 0;
  private autoStartedOnce: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Attendre que l'utilisateur soit authentifié avant de charger la session
    this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.isTokenValid()) {
        console.log('🔑 [WorkSessionService] User authenticated, loading session');
        this.loadCurrentSession();
      } else {
        console.log('🔑 [WorkSessionService] No authenticated user, clearing session');
        this.currentSessionSubject.next(null);
        this.resetTimer();
        // Reset the auto-start guard when user logs out
        this.autoStartedOnce = false;
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ [WorkSessionService] No authentication token available');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    console.log('🔑 [WorkSessionService] Using token for request:', token.substring(0, 20) + '...');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadCurrentSession(): void {
    if (!this.authService.isTokenValid()) {
      console.warn('⚠️ [WorkSessionService] Token not valid, skipping session load');
      this.currentSessionSubject.next(null);
      this.resetTimer();
      return;
    }

    this.getCurrentSession().subscribe({
      next: (session) => {
        console.log('📋 [Session] Session chargée:', session);
        this.currentSessionSubject.next(session);

        if (session) {
          if (session.status === 'active') {
            // Session active : démarrer le timer avec l'heure de début de la session
            console.log('📋 [Session] Session active détectée, démarrage du timer');
            this.startTimer(new Date(session.start_time));
            // Réinitialiser les timers de pause
            this.stopPauseTimer(true);
            const basePause = session.total_pause_time ? this.parseTimeStringToMs(session.total_pause_time) : 0;
            this.accumulatedPauseMs = basePause;
            this.totalPauseSubject.next(this.formatMsToHMS(basePause));
          } else if (session.status === 'paused') {
            // Session en pause : arrêter le timer et afficher le temps accumulé
            console.log('⏸️ [Session] Session en pause détectée, arrêt du timer');
            this.stopTimer();

            // Calculer et afficher le temps accumulé jusqu'à la pause
            if (session.start_time) {
              const accumulatedTime = this.calculateTotalWorkTime(session);
              console.log('⏸️ [Timer] Temps accumulé jusqu\'à la pause:', accumulatedTime);
              this.sessionTimerSubject.next(accumulatedTime);
            }

            // Démarrer le timer de pause
            const basePause = session.total_pause_time ? this.parseTimeStringToMs(session.total_pause_time) : 0;
            this.accumulatedPauseMs = basePause;
            const pauseStart = session.pause_start_time ? new Date(session.pause_start_time) : new Date();
            this.startPauseTimer(pauseStart, basePause);
          } else {
            // Session terminée ou autre état : arrêter le timer
            console.log('📋 [Session] Session terminée ou autre état, arrêt du timer');
            this.resetTimer();
            this.stopPauseTimer(true);
            this.accumulatedPauseMs = 0;
            this.totalPauseSubject.next('00:00:00');
          }
        } else {
          // Aucune session : arrêter le timer
          console.log('📋 [Session] Aucune session trouvée, arrêt du timer');
          this.resetTimer();
          this.stopPauseTimer(true);
          this.accumulatedPauseMs = 0;
          this.totalPauseSubject.next('00:00:00');
          // Auto-start if no active session and not already auto-started
          this.maybeAutoStart();
        }
      },
      error: (error: any) => {
        console.log('📋 [Session] Aucune session active trouvée ou erreur:', error);
        if (error.status === 401) {
          console.warn('⚠️ [WorkSessionService] Authentication failed, clearing session');
          this.authService.logout();
        }
        this.currentSessionSubject.next(null);
        this.resetTimer();
        // Also try auto-start on error if authenticated
        this.maybeAutoStart();
      }
    });
  }

  startSession(notes?: string): Observable<WorkSession> {
    if (!this.ensureAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.handleRequest(
      this.http.post<WorkSession>(`${this.apiUrl}work-sessions/`,
        { notes: notes || '' },
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(session => {
          console.log('🚀 [Session] Session démarrée:', session);
          this.currentSessionSubject.next(session);

          // Démarrer le timer immédiatement avec l'heure actuelle
          const now = new Date();
          console.log('🕐 [Timer] Démarrage immédiat du timer à:', now);

          // Mettre à jour l'affichage à 00:00:00 AVANT de démarrer le timer
          this.sessionTimerSubject.next('00:00:00');

          // Démarrer le timer
          this.startTimer(now);

          // Réinitialiser les timers de pause pour une nouvelle session
          this.stopPauseTimer(true);
          this.accumulatedPauseMs = 0;
          this.totalPauseSubject.next('00:00:00');
        })
      )
    );
  }

  pauseSession(sessionId: number): Observable<WorkSession> {
    if (!this.ensureAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.handleRequest(
      this.http.post<WorkSession>(`${this.apiUrl}${sessionId}/pause/`, {},
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(session => {
          console.log('⏸️ [Session] Session mise en pause:', session);
          this.currentSessionSubject.next(session);

          // Arrêter le timer quand la session est en pause
          console.log('⏸️ [Timer] Arrêt du timer pour session en pause');
          this.stopTimer();

          // Le temps affiché reste le même (pas de reset)
          console.log('⏸️ [Timer] Temps conservé pendant la pause');

          // Démarrer le timer de pause (segment en cours + total)
          const basePause = session.total_pause_time ? this.parseTimeStringToMs(session.total_pause_time) : this.accumulatedPauseMs;
          const pauseStart = session.pause_start_time ? new Date(session.pause_start_time) : new Date();
          this.startPauseTimer(pauseStart, basePause);
        })
      )
    );
  }

  resumeSession(sessionId: number): Observable<WorkSession> {
    if (!this.ensureAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.handleRequest(
      this.http.post<WorkSession>(`${this.apiUrl}${sessionId}/resume/`, {},
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(session => {
          console.log('▶️ [Session] Session reprise:', session);
          this.currentSessionSubject.next(session);

          // Récupérer le temps actuellement affiché
          const currentTime = this.sessionTimerSubject.value;
          console.log('▶️ [Timer] Temps actuel affiché:', currentTime);

          // Calculer le temps écoulé depuis le début
          const timeParts = currentTime.split(':');
          const hours = parseInt(timeParts[0]) || 0;
          const minutes = parseInt(timeParts[1]) || 0;
          const seconds = parseInt(timeParts[2]) || 0;

          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          const startTime = new Date(Date.now() - (totalSeconds * 1000));

          console.log('▶️ [Timer] Redémarrage du timer à partir de:', startTime);
          this.startTimer(startTime);

          // Mettre à jour l'affichage avec le temps actuel
          this.sessionTimerSubject.next(currentTime);

          // Arrêter le timer de pause et mettre à jour le total depuis le backend
          this.stopPauseTimer();
          const basePause = session.total_pause_time ? this.parseTimeStringToMs(session.total_pause_time) : this.accumulatedPauseMs;
          this.accumulatedPauseMs = basePause;
          this.totalPauseSubject.next(this.formatMsToHMS(basePause));
        })
      )
    );
  }

  endSession(sessionId: number): Observable<WorkSession> {
    if (!this.ensureAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.handleRequest(
      this.http.post<WorkSession>(`${this.apiUrl}${sessionId}/end/`, {},
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(session => {
          console.log('Session terminée:', session);
          this.currentSessionSubject.next(null);
          this.resetTimer(); // Utiliser resetTimer au lieu de stopTimer
          this.stopPauseTimer(true);
          this.accumulatedPauseMs = 0;
          this.totalPauseSubject.next('00:00:00');
        })
      )
    );
  }

  getCurrentSession(): Observable<WorkSession | null> {
    if (!this.authService.isTokenValid()) {
      console.warn('⚠️ [WorkSessionService] No valid token for getCurrentSession');
      return throwError(() => new Error('Authentication required'));
    }
    
    // Try both URL formats for compatibility
    const url = `${this.apiUrl}current/`;
    console.log('🔍 [WorkSessionService] Attempting to fetch current session from:', url);
    
    return this.http.get<WorkSession>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response as any),
      map(data => data.message ? null : data),
      catchError((error: any) => {
        console.error('❌ [WorkSessionService] Error getting current session:', error);
        if (error.status === 401) {
          console.warn('⚠️ [WorkSessionService] 401 error, clearing authentication');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  // Méthode publique pour forcer le rechargement
  refreshCurrentSession(): void {
    console.log('Forçage du rechargement de la session actuelle');
    this.loadCurrentSession();
  }

  // Méthode pour vérifier l'authentification
  private ensureAuthenticated(): boolean {
    if (!this.authService.isTokenValid()) {
      console.warn('⚠️ [WorkSessionService] Authentication required');
      this.authService.logout();
      return false;
    }
    return true;
  }

  // Méthode wrapper pour les requêtes HTTP avec gestion d'erreur
  private handleRequest<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError((error: any) => {
        if (error.status === 401) {
          console.warn('⚠️ [WorkSessionService] Authentication failed, logging out');
          this.authService.logout();
        }
        throw error;
      })
    );
  }

  getMyWorkStats(): Observable<EmployeeWorkStats> {
    return this.http.get<EmployeeWorkStats>(`${this.statsUrl}my_stats/`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllEmployeesWorkStats(): Observable<EmployeeWorkStats[]> {
    return this.http.get<EmployeeWorkStats[]>(`${this.statsUrl}all_employees/`,
      { headers: this.getAuthHeaders() }
    );
  }

  private startTimer(startTime: Date): void {
    console.log('🕐 [Timer] Démarrage du timer avec startTime:', startTime);

    // Arrêter l'ancien timer s'il y en a un
    this.stopTimer();

    // Définir le temps de début
    this.sessionStartTime = startTime;

    // Démarrer le nouveau timer
    this.timerInterval = interval(1000).subscribe(() => {
      if (this.sessionStartTime) {
        const now = new Date();
        const diff = now.getTime() - this.sessionStartTime.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log('🕐 [Timer] Mise à jour:', timeString);
        this.sessionTimerSubject.next(timeString);
      }
    });

    console.log('✅ [Timer] Timer démarré avec succès');
  }

  // Méthode pour convertir une chaîne de temps (HH:MM:SS) en millisecondes
  private parseTimeStringToMs(timeString: string): number {
    if (!timeString) return 0;

    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    return 0;
  }

  // Convertir millisecondes -> HH:MM:SS
  private formatMsToHMS(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Méthode pour arrêter complètement le timer et réinitialiser l'état
  private resetTimer(): void {
    if (this.timerInterval) {
      console.log('Arrêt complet du timer:', this.timerInterval);
      this.timerInterval.unsubscribe();
      this.timerInterval = null;
    }

    this.sessionStartTime = null;
    this.sessionTimerSubject.next('00:00:00');
    console.log('Timer complètement réinitialisé');
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      console.log('⏹️ [Timer] Arrêt de l\'ancien timer:', this.timerInterval);
      this.timerInterval.unsubscribe();
      this.timerInterval = null;
    }

    // Ne pas réinitialiser sessionStartTime ici pour maintenir l'état
    // this.sessionStartTime = null;

    // Ne pas forcer le timer à 00:00:00 ici
    // this.sessionTimerSubject.next('00:00:00');

    console.log('⏹️ [Timer] Timer arrêté avec succès');
  }

  // Gestion du timer de pause
  private startPauseTimer(start: Date, baselineMs: number): void {
    // Arrêter si déjà en cours
    this.stopPauseTimer(false);
    this.pauseStartTime = start;
    this.accumulatedPauseMs = baselineMs;
    this.totalPauseSubject.next(this.formatMsToHMS(this.accumulatedPauseMs));
    this.pauseTimerSubject.next('00:00:00');

    this.pauseTimerInterval = interval(1000).subscribe(() => {
      if (this.pauseStartTime) {
        const now = new Date();
        const currentSegmentMs = now.getTime() - this.pauseStartTime.getTime();
        // Mettre à jour le segment en cours
        this.pauseTimerSubject.next(this.formatMsToHMS(currentSegmentMs));
        // Mettre à jour le total (base + segment en cours)
        this.totalPauseSubject.next(this.formatMsToHMS(this.accumulatedPauseMs + currentSegmentMs));
      }
    });
  }

  private stopPauseTimer(resetCurrentSegment: boolean = true): void {
    if (this.pauseTimerInterval) {
      this.pauseTimerInterval.unsubscribe();
      this.pauseTimerInterval = null;
    }
    if (this.pauseStartTime) {
      const now = new Date();
      const currentSegmentMs = now.getTime() - this.pauseStartTime.getTime();
      this.accumulatedPauseMs += Math.max(0, currentSegmentMs);
      this.totalPauseSubject.next(this.formatMsToHMS(this.accumulatedPauseMs));
    }
    this.pauseStartTime = null;
    if (resetCurrentSegment) {
      this.pauseTimerSubject.next('00:00:00');
    }
  }

  getSessionDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  formatTime(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}min`;
  }

  // Méthode pour calculer le temps total travaillé d'une session
  calculateTotalWorkTime(session: WorkSession): string {
    if (!session || !session.start_time) {
      return '00:00:00';
    }

    const startTime = new Date(session.start_time);
    const now = new Date();
    let totalTime = now.getTime() - startTime.getTime();

    // Soustraire le temps de pause si disponible
    if (session.total_pause_time) {
      const pauseTimeMs = this.parseTimeStringToMs(session.total_pause_time);
      totalTime = Math.max(0, totalTime - pauseTimeMs);
    }

    const hours = Math.floor(totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalTime % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Méthode pour forcer la mise à jour du timer
  forceTimerUpdate(): void {
    const currentSession = this.currentSessionSubject.value;
    if (currentSession && currentSession.start_time) {
      const startTime = new Date(currentSession.start_time);
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      console.log('Mise à jour forcée du timer:', timeString);
      this.sessionTimerSubject.next(timeString);
    }
  }

  // Méthode pour obtenir le temps de travail actuel formaté
  getCurrentWorkTime(): string {
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      return this.calculateTotalWorkTime(currentSession);
    }
    return '00:00:00';
  }

  // Obtenir le temps total de pause courant (incluant segment en cours)
  getTotalPauseTime(): string {
    return this.totalPauseSubject.value;
  }

  // Démarrage automatique d'une session de travail si l'utilisateur est authentifié et qu'aucune session n'est active
  private maybeAutoStart(): void {
    if (this.autoStartedOnce) {
      return;
    }
    if (!this.authService.isTokenValid()) {
      return;
    }
    this.autoStartedOnce = true;
    console.log('🚀 [AutoStart] No active session detected, starting a new session automatically');
    this.startSession().subscribe({
      next: () => console.log('✅ [AutoStart] Session started automatically'),
      error: (e) => {
        console.error('❌ [AutoStart] Failed to start session automatically:', e);
        // Autoriser un nouvel essai ultérieur
        this.autoStartedOnce = false;
      }
    });
  }
}
