import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'project_assignment' | 'task_assignment' | 'deadline_reminder' | 'general';
  is_read: boolean;
  created_at: string;
  project_id?: number;
  task_id?: number;
}

export interface EmailNotification {
  to_email: string;
  subject: string;
  message: string;
  project_id?: number;
  task_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken?.();
    if (!token) return new HttpHeaders({ 'Content-Type': 'application/json' });
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Envoyer une notification système
  sendSystemNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications/`, notification, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        console.warn('[NotificationService] sendSystemNotification failed:', error?.status || error);
        // Fail silently on environments without notifications backend
        return of({ ...(notification as any), id: 0, is_read: false, created_at: new Date().toISOString() } as Notification);
      })
    );
  }

  // Envoyer un email
  sendEmailNotification(emailData: EmailNotification): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/send-email/`, emailData, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        console.warn('[NotificationService] sendEmailNotification failed:', error?.status || error);
        return of({ success: false });
      })
    );
  }

  // Notifier l'assignation d'un projet
  notifyProjectAssignment(projectId: number, employeeIds: number[], projectTitle: string): Observable<any> {
    const notificationData = {
      project_id: projectId,
      employee_ids: employeeIds,
      project_title: projectTitle,
      type: 'project_assignment'
    };
    return this.http.post(`${this.apiUrl}/notifications/project-assignment/`, notificationData, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        console.warn('[NotificationService] notifyProjectAssignment failed:', error?.status || error);
        return of({ success: false });
      })
    );
  }

  // Récupérer les notifications d'un utilisateur
  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/user/${userId}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          console.info('[NotificationService] notifications endpoint not found, returning empty list');
          return of([]);
        }
        return of([]);
      })
    );
  }

  // Marquer une notification comme lue
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${notificationId}/read/`, {}, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(userId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/user/${userId}/mark-all-read/`, {}, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  // Supprimer une notification
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${notificationId}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  // Récupérer le nombre de notifications non lues
  getUnreadCount(userId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/user/${userId}/unread-count/`, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          console.info('[NotificationService] unread-count endpoint not found, returning 0');
          return of({ count: 0 });
        }
        return of({ count: 0 });
      })
    );
  }
}
