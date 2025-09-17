import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: number;
  content: string;
  timestamp: string;
  message_type: 'user' | 'bot' | 'system';
  is_helpful?: boolean;
}

export interface ChatConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  messages: ChatMessage[];
  message_count: number;
  last_message?: {
    content: string;
    timestamp: string;
    message_type: string;
  };
}

export interface SendMessageResponse {
  conversation_id: number;
  user_message: {
    id: number;
    content: string;
    timestamp: string;
  };
  bot_response: {
    id: number;
    content: string;
    timestamp: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://127.0.0.1:8000/api/chatbot';
  private currentConversationSubject = new BehaviorSubject<ChatConversation | null>(null);
  public currentConversation$ = this.currentConversationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Envoyer un message au chatbot
   */
  sendMessage(message: string, conversationId?: number): Observable<SendMessageResponse> {
    const payload: any = { message };
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    return this.http.post<SendMessageResponse>(
      `${this.apiUrl}/send-message/`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(
      `${this.apiUrl}/conversations/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupérer les messages d'une conversation spécifique
   */
  getConversationMessages(conversationId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Supprimer une conversation
   */
  deleteConversation(conversationId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/conversations/${conversationId}/delete/`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Définir la conversation actuelle
   */
  setCurrentConversation(conversation: ChatConversation | null): void {
    this.currentConversationSubject.next(conversation);
  }

  /**
   * Obtenir la conversation actuelle
   */
  getCurrentConversation(): ChatConversation | null {
    return this.currentConversationSubject.value;
  }

  /**
   * Ajouter un message à la conversation actuelle
   */
  addMessageToCurrentConversation(message: ChatMessage): void {
    const currentConversation = this.getCurrentConversation();
    if (currentConversation) {
      currentConversation.messages.push(message);
      currentConversation.message_count = currentConversation.messages.length;
      currentConversation.last_message = {
        content: message.content,
        timestamp: message.timestamp,
        message_type: message.message_type
      };
      this.setCurrentConversation({ ...currentConversation });
    }
  }

  /**
   * Créer une nouvelle conversation
   */
  createNewConversation(): void {
    this.setCurrentConversation(null);
  }

  /**
   * Questions prédéfinies pour aider l'utilisateur
   */
  getQuickQuestions(): string[] {
    return [
      "Comment voir mes tâches ?",
      "Comment créer un nouveau projet ?",
      "Où sont mes notifications ?",
      "Comment assigner un employé ?",
      "Aide navigation",
      "Raccourcis clavier"
    ];
  }

  /**
   * Suggestions de questions basées sur le contexte
   */
  getContextualSuggestions(currentRoute?: string): string[] {
    if (currentRoute?.includes('projects')) {
      return [
        "Comment créer un projet ?",
        "Comment assigner des employés ?",
        "Comment voir les tâches d'un projet ?"
      ];
    } else if (currentRoute?.includes('employees')) {
      return [
        "Comment ajouter un employé ?",
        "Comment voir les projets d'un employé ?",
        "Comment modifier les informations d'un employé ?"
      ];
    } else if (currentRoute?.includes('tasks')) {
      return [
        "Comment créer une tâche ?",
        "Comment changer le statut d'une tâche ?",
        "Comment voir mes tâches assignées ?"
      ];
    }
    
    return this.getQuickQuestions();
  }

  /**
   * Formater le contenu markdown pour l'affichage
   */
  formatMessageContent(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '• ');
  }
}
