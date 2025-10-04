import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('access_token');
    if (token) {
      this.headers = this.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // === GESTION DES SESSIONS ===

  startSession(data: any): Observable<WorkSession> {
    return this.http.post<WorkSession>(`${this.apiUrl}/start_session/`, data, { headers: this.headers });
  }

  pauseSession(sessionId: number, pauseData: PauseData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/pause/`, pauseData, { headers: this.headers });
  }

  resumeSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/resume/`, {}, { headers: this.headers });
  }

  endSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/end/`, {}, { headers: this.headers });
  }

  // === RÉCUPÉRATION DES DONNÉES ===

  getSessions(): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(this.apiUrl, { headers: this.headers });
  }

  getCurrentSession(): Observable<WorkSession | null> {
    return this.http.get<WorkSession>(`${this.apiUrl}/current-session/`, { headers: this.headers });
  }

  getSessionById(sessionId: number): Observable<WorkSession> {
    return this.http.get<WorkSession>(`${this.apiUrl}/${sessionId}/`, { headers: this.headers });
  }

  // === STATISTIQUES ===

  getSessionStats(period: 'today' | 'week' | 'month' = 'today'): Observable<SessionStats> {
    return this.http.get<SessionStats>(`${this.apiUrl}/stats/${period}/`, { headers: this.headers });
  }

  getEmployeeStats(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${employeeId}/stats/`, { headers: this.headers });
  }

  // === FILTRES ET RECHERCHE ===

  searchSessions(query: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/search/?q=${encodeURIComponent(query)}`, { headers: this.headers });
  }

  getSessionsByStatus(status: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/status/${status}/`, { headers: this.headers });
  }

  getSessionsByDateRange(startDate: string, endDate: string): Observable<WorkSession[]> {
    return this.http.get<WorkSession[]>(`${this.apiUrl}/date_range/?start=${startDate}&end=${endDate}`, { headers: this.headers });
  }

  // === EXPORT ===

  exportSessions(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/?format=${format}`, {
      headers: this.headers,
      responseType: 'blob'
    });
  }

  // === MISE À JOUR ===

  updateSession(sessionId: number, data: Partial<WorkSession>): Observable<WorkSession> {
    return this.http.patch<WorkSession>(`${this.apiUrl}/${sessionId}/`, data, { headers: this.headers });
  }

  addNotes(sessionId: number, notes: string): Observable<WorkSession> {
    return this.http.patch<WorkSession>(`${this.apiUrl}/${sessionId}/`, { notes }, { headers: this.headers });
  }

  // === UTILITAIRES ===

  private updateHeaders(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.headers = this.headers.set('Authorization', `Bearer ${token}`);
    }
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













