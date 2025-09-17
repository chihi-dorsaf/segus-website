import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-bell" (click)="toggleDropdown()">
      <div class="bell-icon">
        <i class="fas fa-bell"></i>
        <span *ngIf="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
      </div>

      <div *ngIf="showDropdown" class="notification-dropdown">
        <div class="dropdown-header">
          <h4>Notifications</h4>
          <button *ngIf="unreadCount > 0" (click)="markAllAsRead()" class="mark-all-read">
            Marquer tout comme lu
          </button>
        </div>

        <div class="notifications-list">
          <div *ngIf="notifications.length === 0" class="no-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>Aucune notification</p>
          </div>

          <div *ngFor="let notification of notifications"
               class="notification-item"
               [class.unread]="!notification.is_read"
               (click)="markAsRead(notification)">
            <div class="notification-icon">
              <i [class]="getNotificationIcon(notification.type)"></i>
            </div>
            <div class="notification-content">
              <h5>{{ notification.title }}</h5>
              <p>{{ notification.message }}</p>
              <small>{{ formatDate(notification.created_at) }}</small>
            </div>
            <button *ngIf="!notification.is_read" class="mark-read-btn" (click)="markAsRead(notification); $event.stopPropagation()">
              <i class="fas fa-check"></i>
            </button>
          </div>
        </div>

        <div class="dropdown-footer">
          <a href="/notifications">Voir toutes les notifications</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      cursor: pointer;
    }

    .bell-icon {
      position: relative;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .bell-icon:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .bell-icon i {
      font-size: 1.2rem;
      color: #fff;
    }

    .notification-badge {
      position: absolute;
      top: 0;
      right: 0;
      background-color: #ef4444;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 350px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid #e2e8f0;
      z-index: 1000;
      margin-top: 8px;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .dropdown-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .mark-all-read {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 0.8rem;
      cursor: pointer;
      text-decoration: underline;
    }

    .mark-all-read:hover {
      color: #2563eb;
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .no-notifications {
      text-align: center;
      padding: 32px 16px;
      color: #64748b;
    }

    .no-notifications i {
      font-size: 2rem;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .no-notifications p {
      margin: 0;
      font-size: 0.9rem;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: #f8fafc;
    }

    .notification-item.unread {
      background-color: #f0f9ff;
    }

    .notification-icon {
      margin-right: 12px;
      margin-top: 2px;
    }

    .notification-icon i {
      width: 16px;
      color: #3b82f6;
    }

    .notification-content {
      flex: 1;
    }

    .notification-content h5 {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .notification-content p {
      margin: 0 0 4px 0;
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
    }

    .notification-content small {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .mark-read-btn {
      background: none;
      border: none;
      color: #10b981;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .mark-read-btn:hover {
      background-color: #f0fdf4;
    }

    .dropdown-footer {
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .dropdown-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .dropdown-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .notification-dropdown {
        width: 300px;
        right: -50px;
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;
  private refreshSubscription?: Subscription;
  private currentUserId?: number;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    if (this.currentUserId) {
      this.loadNotifications();
      this.loadUnreadCount();

      // Rafraîchir les notifications toutes les 30 secondes
      this.refreshSubscription = interval(30000).subscribe(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      });
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    if (!this.currentUserId) return;

    this.notificationService.getUserNotifications(this.currentUserId).subscribe((notifications) => {
      this.notifications = (notifications || []).slice(0, 10);
    });
  }

  loadUnreadCount() {
    if (!this.currentUserId) return;

    this.notificationService.getUnreadCount(this.currentUserId).subscribe((response) => {
      this.unreadCount = response?.count || 0;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
        this.loadUnreadCount();
      },
      error: (error) => {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    });
  }

  markAllAsRead() {
    if (!this.currentUserId) return;

    this.notificationService.markAllAsRead(this.currentUserId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.unreadCount = 0;
      },
      error: (error) => {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'project_assignment':
        return 'fas fa-project-diagram';
      case 'task_assignment':
        return 'fas fa-tasks';
      case 'deadline_reminder':
        return 'fas fa-clock';
      default:
        return 'fas fa-bell';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }
}
