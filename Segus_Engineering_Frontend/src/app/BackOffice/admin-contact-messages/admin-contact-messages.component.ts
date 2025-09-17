import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactMessage, ContactMessageStats } from '../../services/contact.service';

@Component({
  selector: 'app-admin-contact-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contact-messages.component.html',
  styleUrls: ['./admin-contact-messages.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminContactMessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  filteredMessages: ContactMessage[] = [];
  stats: ContactMessageStats | null = null;
  selectedMessage: ContactMessage | null = null;
  loading = false;

  // Filtres
  selectedStatus = '';
  selectedPriority = '';
  searchTerm = '';

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.loadMessages();
    this.loadStats();
  }

  loadMessages() {
    this.loading = true;
    this.contactService.getAllMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement messages:', error);
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.contactService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
      }
    });
  }

  applyFilters() {
    this.filteredMessages = this.messages.filter(message => {
      const matchesStatus = !this.selectedStatus || message.status === this.selectedStatus;
      const matchesPriority = !this.selectedPriority || message.priority === this.selectedPriority;
      const matchesSearch = !this.searchTerm || 
        message.first_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (message.subject && message.subject.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  refreshMessages() {
    this.loadMessages();
    this.loadStats();
  }

  viewMessage(message: ContactMessage) {
    this.selectedMessage = message;
    // Marquer comme lu automatiquement lors de la visualisation
    if (message.status === 'unread') {
      this.markAsRead(message);
    }
    // Ouvrir le modal Bootstrap
    const modal = new (window as any).bootstrap.Modal(document.getElementById('messageModal'));
    modal.show();
  }

  markAsRead(message: ContactMessage) {
    if (message.id) {
      this.contactService.markAsRead(message.id).subscribe({
        next: (response) => {
          message.status = 'read';
          message.status_color = '#1a73c1'; // Bleu Segus
          this.loadStats(); // Recharger les stats
        },
        error: (error) => {
          console.error('Erreur marquage lu:', error);
        }
      });
    }
  }

  markAsReplied(messageId: number) {
    this.contactService.markAsReplied(messageId).subscribe({
      next: (response) => {
        // Mettre à jour le message dans la liste
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
          message.status = 'replied';
          message.status_color = '#28a745'; // Vert
        }
        this.loadStats(); // Recharger les stats
        this.applyFilters(); // Réappliquer les filtres
      },
      error: (error) => {
        console.error('Erreur marquage répondu:', error);
      }
    });
  }

  deleteMessage(messageId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      this.contactService.deleteMessage(messageId).subscribe({
        next: () => {
          this.loadMessages();
          this.loadStats();
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
        }
      });
    }
  }

  exportMessages() {
    // Créer un CSV des messages filtrés
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `messages_contact_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(): string {
    const headers = ['Prénom', 'Nom', 'Email', 'Sujet', 'Message', 'Statut', 'Priorité', 'Date'];
    const rows = this.filteredMessages.map(msg => [
      msg.first_name,
      msg.last_name,
      msg.email,
      msg.subject || '',
      msg.message.replace(/"/g, '""'), // Échapper les guillemets
      this.getStatusLabel(msg.status!),
      this.getPriorityLabel(msg.priority!),
      this.formatDate(msg.created_at!)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Méthodes utilitaires - supprimée car dupliquée plus bas

  getMessagePreview(message: string): string {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'unread': 'Non lu',
      'read': 'Lu',
      'replied': 'Répondu',
      'archived': 'Archivé'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Faible',
      'medium': 'Moyenne',
      'high': 'Élevée',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Nouvelles méthodes pour l'interface améliorée
  trackByMessageId(index: number, message: ContactMessage): number {
    return message.id || index;
  }

  getAvatarColor(firstName: string | undefined): string {
    if (!firstName) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    const index = firstName.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getStatusIcon(status: string | undefined): string {
    if (!status) return 'fa-envelope';
    const icons: { [key: string]: string } = {
      'unread': 'fa-envelope',
      'read': 'fa-envelope-open',
      'replied': 'fa-reply',
      'archived': 'fa-archive'
    };
    return icons[status] || 'fa-envelope';
  }

  getPriorityIcon(priority: string | undefined): string {
    if (!priority) return 'fa-circle';
    const icons: { [key: string]: string } = {
      'low': 'fa-circle',
      'medium': 'fa-exclamation-circle',
      'high': 'fa-exclamation-triangle',
      'urgent': 'fa-fire'
    };
    return icons[priority] || 'fa-circle';
  }

  formatDateShort(dateString: string | undefined): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  getRelativeTime(dateString: string | undefined): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `${diffMins}min`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}j`;
    }
  }

  getRepliedCount(): number {
    if (!this.stats?.status_distribution) return 0;
    const repliedStat = this.stats.status_distribution.find(s => s.status === 'replied');
    return repliedStat?.count || 0;
  }

  getRepliedPercentage(): number {
    if (!this.stats?.total_messages || this.stats.total_messages === 0) return 0;
    return (this.getRepliedCount() / this.stats.total_messages) * 100;
  }

  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
