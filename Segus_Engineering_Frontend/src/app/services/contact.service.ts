import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  subject?: string;
  message: string;
  status?: string;
  priority?: string;
  created_at?: string;
  read_at?: string;
  replied_at?: string;
  handled_by?: number;
  admin_notes?: string;
  full_name?: string;
  status_color?: string;
  priority_color?: string;
  is_recent?: boolean;
  response_time_display?: string;
  handled_by_name?: string;
}

export interface ContactMessageStats {
  total_messages: number;
  unread_messages: number;
  recent_messages: number;
  status_distribution: Array<{status: string, count: number}>;
  priority_distribution: Array<{priority: string, count: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://127.0.0.1:8000/api/contact-messages/';

  constructor(private http: HttpClient) { }

  // Envoyer un message de contact (accessible à tous)
  sendMessage(messageData: Partial<ContactMessage>): Observable<any> {
    return this.http.post(this.apiUrl, messageData);
  }

  // Récupérer tous les messages (admin seulement)
  getAllMessages(params?: any): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(this.apiUrl, { params });
  }

  // Récupérer un message spécifique
  getMessage(id: number): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(`${this.apiUrl}${id}/`);
  }

  // Mettre à jour un message (admin seulement)
  updateMessage(id: number, updateData: Partial<ContactMessage>): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}${id}/`, updateData);
  }

  // Supprimer un message (admin seulement)
  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  // Marquer comme lu
  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}${id}/mark_as_read/`, {});
  }

  // Marquer comme répondu
  markAsReplied(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}${id}/mark_as_replied/`, {});
  }

  // Récupérer les statistiques
  getStats(): Observable<ContactMessageStats> {
    return this.http.get<ContactMessageStats>(`${this.apiUrl}stats/`);
  }

  // Récupérer les messages non lus
  getUnreadMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.apiUrl}unread/`);
  }

  // Récupérer les messages récents
  getRecentMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.apiUrl}recent/`);
  }
}
