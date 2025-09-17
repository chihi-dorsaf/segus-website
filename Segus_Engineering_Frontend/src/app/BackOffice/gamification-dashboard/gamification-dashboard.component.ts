import { Component, OnInit } from '@angular/core';
import { GamificationService, GamificationDashboard, SubTask, DailyObjective } from '../../services/gamification.service';

@Component({
  selector: 'app-gamification-dashboard',
  templateUrl: './gamification-dashboard.component.html',
  styleUrls: ['./gamification-dashboard.component.css']
})
export class GamificationDashboardComponent implements OnInit {
  dashboard: GamificationDashboard | null = null;
  isLoading = false;
  error: string | null = null;

  // Modal states
  showObjectiveModal = false;
  showTaskModal = false;
  showBadgeDetailsModal = false;
  selectedBadge: any = null;

  // Form data
  newTask: Partial<SubTask> = {
    title: '',
    description: '',
    status: 'pending'
  };

  constructor(
    private gamificationService: GamificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.error = null;

    this.gamificationService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du tableau de bord:', error);
        this.error = 'Impossible de charger le tableau de bord de gamification';
        this.isLoading = false;
        console.error('Erreur de chargement du tableau de bord');
      }
    });
  }

  // Task Management
  completeTask(taskId: number): void {
    this.gamificationService.completeSubTask(taskId).subscribe({
      next: (updatedTask) => {
        console.log('Tâche terminée avec succès!');
        this.loadDashboard(); // Reload to update stats
      },
      error: (error) => {
        console.error('Erreur lors de la completion de la tâche:', error);
        console.error('Erreur lors de la completion de la tâche');
      }
    });
  }

  createTask(): void {
    if (!this.newTask.title) {
      console.error('Le titre de la tâche est requis');
      return;
    }

    // Add employee ID from dashboard data
    if (this.dashboard?.employee_info?.employee) {
      this.newTask.employee = this.dashboard.employee_info.employee;
    }

    this.gamificationService.createSubTask(this.newTask).subscribe({
      next: (task) => {
        console.log('Tâche créée avec succès!');
        this.closeTaskModal();
        this.loadDashboard();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la tâche:', error);
        console.error('Erreur lors de la création de la tâche');
      }
    });
  }

  // Modal Management
  openTaskModal(): void {
    this.showTaskModal = true;
    this.newTask = {
      title: '',
      description: '',
      status: 'pending'
    };
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.newTask = {
      title: '',
      description: '',
      status: 'pending'
    };
  }

  openBadgeDetails(badge: any): void {
    this.selectedBadge = badge;
    this.showBadgeDetailsModal = true;
  }

  closeBadgeDetailsModal(): void {
    this.showBadgeDetailsModal = false;
    this.selectedBadge = null;
  }

  // Utility Methods
  getProgressPercentage(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  getStarRating(stars: number): string[] {
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 >= 0.25;
    const rating = [];

    for (let i = 0; i < fullStars; i++) {
      rating.push('star');
    }

    if (hasHalfStar) {
      rating.push('star_half');
    }

    while (rating.length < 5) {
      rating.push('star_border');
    }

    return rating;
  }

  getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'expert': return '#10b981';
      case 'avancé': return '#f59e0b';
      case 'intermédiaire': return '#06b6d4';
      default: return '#6b7280';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
