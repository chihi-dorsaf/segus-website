import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface WorkSession {
  id: number;
  employee: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed';
  total_work_time?: string;
  pause_start_time?: string;
  total_pause_time?: string;
  notes?: string;
  project?: string;
  task?: string;
}

export interface PauseData {
  reason: string;
  estimated_duration: number;
}

export interface SessionStats {
  total_hours: number;
  pause_hours: number;
  net_hours: number;
  efficiency: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeWorkHoursService {
  private apiUrl = `${environment.apiUrl}/api/employees/work-sessions`;
  private baseHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    if (token) {
      return this.baseHeaders.set('Authorization', `Bearer ${token}`);
    }
    return this.baseHeaders;
  }

  // === GESTION DES SESSIONS ===

  startSession(data: any): Observable<WorkSession> {
    // Backend action name is 'work-sessions' on the WorkSessionViewSet
    // POST /api/employees/work-sessions/work-sessions/
    return this.http.post<WorkSession>(`${this.apiUrl}/work-sessions/`, data, { headers: this.getAuthHeaders() });
  }

  pauseSession(sessionId: number, pauseData: PauseData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/pause/`, pauseData, { headers: this.getAuthHeaders() });
  }

  resumeSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/resume/`, {}, { headers: this.getAuthHeaders() });
  }

  endSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/end/`, {}, { headers: this.getAuthHeaders() });
  }

  // === RÉCUPÉRATION DES DONNÉES ===

  getSessions(): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getCurrentSession(): Observable<WorkSession | null> {
    // Backend exposes GET /api/employees/work-sessions/current/
    return this.http.get<WorkSession>(`${this.apiUrl}/current/`, { headers: this.getAuthHeaders() });
  }

  getSessionById(sessionId: number): Observable<WorkSession> {
    return this.http.get<WorkSession>(`${this.apiUrl}/${sessionId}/`, { headers: this.getAuthHeaders() });
  }

  // === STATISTIQUES ===

  getSessionStats(period: 'today' | 'week' | 'month' = 'today'): Observable<SessionStats> {
    // Backend exposes GET /api/employees/work-sessions/statistics/
    return this.http.get<SessionStats>(`${this.apiUrl}/statistics/`, { headers: this.getAuthHeaders() });
  }

  getEmployeeStats(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${employeeId}/stats/`, { headers: this.getAuthHeaders() });
  }

  // === FILTRES ET RECHERCHE ===

  searchSessions(query: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/search/?q=${encodeURIComponent(query)}`, { headers: this.getAuthHeaders() });
  }

  getSessionsByStatus(status: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/status/${status}/`, { headers: this.getAuthHeaders() });
  }

  getSessionsByDateRange(startDate: string, endDate: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/date_range/?start=${startDate}&end=${endDate}`, { headers: this.getAuthHeaders() });
  }

  // === EXPORT ===

  exportSessions(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/?format=${format}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // === MISE À JOUR ===

  updateSession(sessionId: number, data: Partial<WorkSession>): Observable<WorkSession> {
    return this.http.patch<WorkSession>(`${this.apiUrl}/${sessionId}/`, data, { headers: this.getAuthHeaders() });
  }

  addNotes(sessionId: number, notes: string): Observable<WorkSession> {
    return this.http.patch<WorkSession>(`${this.apiUrl}/${sessionId}/`, { notes }, { headers: this.getAuthHeaders() });
  }

  // === UTILITAIRES ===

  private updateHeaders(): void {
    // No-op: kept for backward compatibility; headers are built per request
  }

  refreshToken(): void {
    this.updateHeaders();
  }

  // === GESTION DES ERREURS ===

  handleError(error: any): string {
    if (error.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      return 'Accès refusé. Permissions insuffisantes.';
    } else if (error.status === 404) {
      return 'Session non trouvée.';
    } else if (error.status === 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    } else {
      return 'Une erreur inattendue s\'est produite.';
    }
  }
}














