import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDarkMode = false;
  isAuthenticated = false;
  isEmployee = false;
  // Propriétés pour la gestion des utilisateurs
  user: any = null;
  notificationsCount = 0;
  
  // Propriétés pour les notifications
  showNotifications = false;
  notifications: any[] = [];
  hasUnreadNotifications = false;
  activeDropdown: string | null = null;
  
  // Propriétés pour le menu utilisateur
  currentUser: any = null;
  userMenuOpen = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.verifierRouteActive();
      }
    });

    // Charger l'utilisateur actuel au démarrage si un token existe
    if (this.authService.isTokenValid()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => {
          console.log('✅ [Header] User loaded on init:', user);
        },
        error: (error) => {
          console.warn('⚠️ [Header] Failed to load user on init:', error);
          if (error.status === 401) {
            this.authService.logout();
          }
        }
      });
    }

    this.isAuthenticated = this.authService.isAuthenticated();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isEmployee = !!user && (user.role?.toUpperCase?.() === 'EMPLOYE');
      this.isAuthenticated = this.authService.isAuthenticated();
    });
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  basculerModeSombre() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  verifierRouteActive() {
    const liens = document.querySelectorAll('.nav-link');
    liens.forEach(lien => {
      const routerLink = (lien as HTMLAnchorElement).getAttribute('routerLink');
      if (this.isActive(routerLink || '')) {
        lien.classList.add('active');
      } else {
        lien.classList.remove('active');
      }
    });
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile')) {
      this.userMenuOpen = false;
    }
  }

  // Debug method to test menu toggle
  testMenuToggle() {
    console.log('Current userMenuOpen state:', this.userMenuOpen);
    this.userMenuOpen = !this.userMenuOpen;
    console.log('New userMenuOpen state:', this.userMenuOpen);
  }

  getUserRoleLabel(role: string): string {
    switch(role?.toUpperCase()) {
      case 'EMPLOYE': return 'Employé';
      case 'ADMIN': return 'Administrateur';
      case 'MANAGER': return 'Manager';
      default: return 'Utilisateur';
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/frontoffice/profile']);
    this.userMenuOpen = false;
  }

  navigateToSettings(): void {
    this.router.navigate(['/frontoffice/settings']);
    this.userMenuOpen = false;
  }

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

  logout(): void {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  // Méthodes pour la navigation dropdown du site vitrine
  toggleDropdown(dropdownName: string): void {
    this.activeDropdown = this.activeDropdown === dropdownName ? null : dropdownName;
  }

  isDropdownActive(dropdownName: string): boolean {
    return this.activeDropdown === dropdownName;
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.activeDropdown = null;
    }
  }

  // Méthodes pour les notifications
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    // Simuler des notifications pour l'instant
    this.notifications = [
      {
        id: 1,
        type: 'task',
        title: 'Nouvelle tâche assignée',
        message: 'Une nouvelle tâche vous a été assignée dans le projet Segus Engineering',
        created_at: new Date().toISOString(),
        is_read: false
      },
      {
        id: 2,
        type: 'deadline',
        title: 'Deadline approchante',
        message: 'La deadline du projet approche dans 2 jours',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: false
      },
      {
        id: 3,
        type: 'update',
        title: 'Mise à jour du projet',
        message: 'Le statut du projet a été mis à jour',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: true
      }
    ];
    
    this.updateNotificationCounts();
  }

  updateNotificationCounts(): void {
    this.notificationsCount = this.notifications.filter(n => !n.is_read).length;
    this.hasUnreadNotifications = this.notificationsCount > 0;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.is_read = true;
      this.updateNotificationCounts();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.is_read = true);
    this.updateNotificationCounts();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task': return 'fa-tasks';
      case 'deadline': return 'fa-clock';
      case 'update': return 'fa-sync-alt';
      case 'message': return 'fa-envelope';
      default: return 'fa-bell';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'task': return 'notification-task';
      case 'deadline': return 'notification-deadline';
      case 'update': return 'notification-update';
      case 'message': return 'notification-message';
      default: return 'notification-default';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  }

  viewAllNotifications(): void {
    this.showNotifications = false;
    // TODO: Navigate to notifications page
    console.log('Naviguer vers toutes les notifications');
  }
}
