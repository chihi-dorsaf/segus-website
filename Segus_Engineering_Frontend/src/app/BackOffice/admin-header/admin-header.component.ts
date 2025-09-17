import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ContactService, ContactMessage } from '../../services/contact.service';

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface Message {
  id: number;
  sender: string;
  initials: string;
  content: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']
})
export class AdminHeaderComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();

  user: any = null;
  showUserMenu = false;
  showNotifications = false;
  showMessages = false;

  notifications: Notification[] = [
    {
      id: 1,
      message: 'Nouvel employé créé avec succès',
      time: 'Il y a 2 min',
      read: false,
      icon: 'fas fa-user-plus',
      type: 'success'
    },
    {
      id: 2,
      message: 'Rapport mensuel disponible',
      time: 'Il y a 1 heure',
      read: false,
      icon: 'fas fa-chart-line',
      type: 'info'
    },
    {
      id: 3,
      message: 'Mise à jour système terminée',
      time: 'Il y a 3 heures',
      read: true,
      icon: 'fas fa-cog',
      type: 'success'
    },
    {
      id: 4,
      message: 'Sauvegarde automatique effectuée',
      time: 'Il y a 5 heures',
      read: true,
      icon: 'fas fa-shield-alt',
      type: 'info'
    }
  ];

  messages: Message[] = [];
  contactMessages: ContactMessage[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private contactService: ContactService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadContactMessages();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeAllDropdowns();
    }
  }

  loadUserProfile() {
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Erreur chargement profil:', error);
        // Données par défaut pour la démonstration
        this.user = {
          first_name: 'Ahmed',
          last_name: 'Mansouri',
          email: 'ahmed.mansouri@segus.com',
          role: 'Administrateur'
        };
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
      this.showMessages = false;
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
      this.showMessages = false;
    }
  }

  toggleMessages() {
    this.showMessages = !this.showMessages;
    if (this.showMessages) {
      this.showUserMenu = false;
      this.showNotifications = false;
    }
  }

  closeAllDropdowns() {
    this.showUserMenu = false;
    this.showNotifications = false;
    this.showMessages = false;
  }

  closeDropdown(dropdown: 'user' | 'notifications' | 'messages') {
    switch (dropdown) {
      case 'user':
        this.showUserMenu = false;
        break;
      case 'notifications':
        this.showNotifications = false;
        break;
      case 'messages':
        this.showMessages = false;
        break;
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.logout.emit();
    this.closeAllDropdowns();
  }

  onProfile() {
    this.router.navigate(['/admin/profile']);
    this.closeAllDropdowns();
  }

  onSettings() {
    this.router.navigate(['/admin/settings']);
    this.closeAllDropdowns();
  }

  onHelp() {
    this.router.navigate(['/admin/help']);
    this.closeAllDropdowns();
  }

  markNotificationAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
    }
  }

  markMessageAsRead(messageId: number) {
    const message = this.messages.find(m => m.id === messageId);
    if (message && !message.read) {
      message.read = true;
    }
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getUnreadMessagesCount(): number {
    return this.contactMessages.filter(m => m.status === 'unread').length;
  }

  getUserInitials(): string {
    if (this.user?.first_name && this.user?.last_name) {
      return (this.user.first_name.charAt(0) + this.user.last_name.charAt(0)).toUpperCase();
    }
    return this.user?.username?.substring(0, 2).toUpperCase() || 'U';
  }

  getUserFullName(): string {
    if (this.user?.first_name && this.user?.last_name) {
      return `${this.user.first_name} ${this.user.last_name}`;
    }
    return this.user?.username || 'Utilisateur';
  }

  getUserRole(): string {
    return this.user?.role || 'Administrateur';
  }

  getUserEmail(): string {
    return this.user?.email || '';
  }

  getNotificationIconClass(notification: Notification): string {
    return notification.icon;
  }

  onNotificationClick(notification: Notification) {
    this.markNotificationAsRead(notification.id);
    // Ajouter ici la logique de navigation ou d'action spécifique à la notification
    console.log('Notification clicked:', notification);
  }

  onMessageClick(message: Message) {
    this.markMessageAsRead(message.id);
    // Trouver le message de contact correspondant
    const contactMessage = this.contactMessages.find(cm => cm.id === message.id);
    if (contactMessage && contactMessage.status === 'unread') {
      this.contactService.markAsRead(contactMessage.id!).subscribe({
        next: () => {
          contactMessage.status = 'read';
          message.read = true;
        },
        error: (error) => {
          console.error('Erreur marquage message lu:', error);
        }
      });
    }
    // Navigation vers la page des messages de contact
    this.router.navigate(['/admin/contact-messages']);
    this.closeAllDropdowns();
  }

  loadContactMessages() {
    this.contactService.getRecentMessages().subscribe({
      next: (messages) => {
        this.contactMessages = messages;
        // Convertir pour l'affichage dans le template existant
        this.messages = messages.map(msg => ({
          id: msg.id!,
          sender: msg.full_name || `${msg.first_name} ${msg.last_name}`,
          initials: this.getInitials(msg.first_name, msg.last_name),
          content: msg.subject || msg.message.substring(0, 50) + '...',
          time: this.formatTime(msg.created_at!),
          read: msg.status !== 'unread'
        }));
      },
      error: (error) => {
        console.error('Erreur chargement messages:', error);
        // Garder les messages par défaut en cas d'erreur
        this.messages = [
          {
            id: 1,
            sender: 'Jean Dupont',
            initials: 'JD',
            content: 'Rapport de projet prêt pour validation',
            time: 'Il y a 5 min',
            read: false
          }
        ];
      }
    });
  }

  private getInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffDays}j`;
    }
  }
}
