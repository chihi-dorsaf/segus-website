import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface WorkSessionUpdate {
  type: 'session_started' | 'session_paused' | 'session_resumed' | 'session_ended';
  data: any;
  timestamp: number;
}

export interface AdminStats {
  active_sessions: number;
  connected_employees: number;
  connected_admins: number;
  employee_sessions: any[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: EventSource | null = null;
  private isConnected = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Observables pour les événements
  public connectionStatus$ = this.isConnected.asObservable();
  private workSessionUpdates = new BehaviorSubject<WorkSessionUpdate | null>(null);
  private adminStatsUpdates = new BehaviorSubject<AdminStats | null>(null);
  private sessionStatusUpdates = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {
    // Se connecter automatiquement si l'utilisateur est authentifié
    if (this.authService.isAuthenticated()) {
      this.connect();
    }
  }

  /**
   * Se connecter au serveur Socket.IO
   */
  connect(): void {
    if (this.socket?.readyState === EventSource.OPEN) {
      console.log('🔌 SSE déjà connecté');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification disponible');
      return;
    }

    console.log('🔌 Connexion au serveur SSE...');

    // Fermer la connexion existante si elle existe
    if (this.socket) {
      this.socket.close();
    }

    // Utiliser Server-Sent Events (SSE) pour Django
    // Remove Bearer prefix if present to avoid double encoding
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const sseUrl = `${environment.apiUrl}/api/realtime/sse/work-sessions/?token=${encodeURIComponent(cleanToken)}`;
    this.socket = new EventSource(sseUrl);
    
    this.socket.onopen = () => {
      console.log('✅ Connecté au serveur SSE');
      this.isConnected.next(true);
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Erreur parsing message SSE:', error);
      }
    };
    
    this.socket.onerror = (error: Event) => {
      console.error('❌ Erreur de connexion SSE:', error);
      this.isConnected.next(false);
      
      // Fermer la connexion défaillante
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      
      // Vérifier si l'utilisateur est toujours authentifié avant de reconnecter
      if (!this.authService.isAuthenticated()) {
        console.log('🔐 Utilisateur non authentifié, arrêt des tentatives de reconnexion');
        return;
      }
      
      // Tentative de reconnexion automatique avec backoff exponentiel
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
        setTimeout(() => this.connect(), delay);
      } else {
        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
        this.reconnectAttempts = 0; // Reset pour permettre une reconnexion manuelle plus tard
      }
    };
  }

  /**
   * Gérer les messages WebSocket reçus
   */
  private handleMessage(data: any): void {
    console.log('📨 Message WebSocket reçu:', data);
    
    switch (data.type) {
      case 'work_session_update':
        this.workSessionUpdates.next(data.data);
        break;
      case 'admin_stats_update':
        this.adminStatsUpdates.next(data.data);
        break;
      case 'session_status_update':
        this.sessionStatusUpdates.next(data.data);
        break;
      default:
        console.log('Type de message non géré:', data.type);
    }
  }

  /**
   * Se déconnecter du serveur SSE
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Déconnexion du serveur SSE');
      this.socket.close();
      this.socket = null;
      this.isConnected.next(false);
      this.reconnectAttempts = 0; // Reset reconnection attempts
    }
  }

  /**
   * Vérifier si la connexion est active
   */
  isSocketConnected(): boolean {
    return this.socket?.readyState === EventSource.OPEN || false;
  }

  // === ÉVÉNEMENTS POUR LES SESSIONS DE TRAVAIL ===

  /**
   * Notifier le début d'une session de travail
   */
  notifySessionStarted(sessionData: any): void {
    console.log('📤 Envoi début de session:', sessionData);
    this.sendNotification('work_session_started', sessionData);
  }

  /**
   * Notifier la pause d'une session de travail
   */
  notifySessionPaused(sessionData: any): void {
    console.log('📤 Envoi pause de session:', sessionData);
    this.sendNotification('work_session_paused', sessionData);
  }

  /**
   * Notifier la reprise d'une session de travail
   */
  notifySessionResumed(sessionData: any): void {
    console.log('📤 Envoi reprise de session:', sessionData);
    this.sendNotification('work_session_resumed', sessionData);
  }

  /**
   * Notifier la fin d'une session de travail
   */
  notifySessionEnded(sessionData: any): void {
    console.log('📤 Envoi fin de session:', sessionData);
    this.sendNotification('work_session_ended', sessionData);
  }

  /**
   * Demander une mise à jour des statistiques (pour les admins)
   */
  requestStatsUpdate(): void {
    console.log('📤 Demande mise à jour statistiques');
    this.sendNotification('request_stats_update', {});
  }

  // === OBSERVABLES POUR LES COMPOSANTS ===

  /**
   * Observable pour les mises à jour de sessions de travail
   */
  getWorkSessionUpdates(): Observable<WorkSessionUpdate | null> {
    return this.workSessionUpdates.asObservable();
  }

  /**
   * Observable pour les mises à jour des statistiques admin
   */
  getAdminStatsUpdates(): Observable<AdminStats | null> {
    return this.adminStatsUpdates.asObservable();
  }

  /**
   * Observable pour les mises à jour de statut de session
   */
  getSessionStatusUpdates(): Observable<any> {
    return this.sessionStatusUpdates.asObservable();
  }

  /**
   * Écouter un événement spécifique (non utilisé avec WebSocket natif)
   */
  listen(eventName: string): Observable<any> {
    // Non implémenté pour WebSocket natif
    throw new Error('Méthode non supportée avec WebSocket natif');
  }

  /**
   * Émettre un événement personnalisé
   */
  emit(eventName: string, data: any): void {
    this.sendNotification(eventName, data);
  }

  /**
   * Envoyer une notification au serveur via HTTP POST
   */
  private sendNotification(type: string, data: any): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.warn('⚠️ Utilisateur non authentifié');
      return;
    }

    const payload = {
      type: type,
      user_id: user.id,
      data: data,
      timestamp: Date.now()
    };

    fetch(`${environment.apiUrl}/api/realtime/notify-session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.error('Erreur envoi notification:', error);
    });
  }

  /**
   * Obtenir le statut de connexion actuel
   */
  getConnectionStatus(): boolean {
    return this.isConnected.value;
  }

  /**
   * Forcer la reconnexion
   */
  forceReconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}
