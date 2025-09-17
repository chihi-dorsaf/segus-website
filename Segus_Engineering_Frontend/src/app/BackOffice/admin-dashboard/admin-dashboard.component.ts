import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeWorkHoursService } from '../../services/employee-work-hours.service';
import { SocketService } from '../../services/socket.service';
import { JobService } from '../../services/job.service';

interface Project {
  title: string;
  description: string;
  status: string;
}

interface DashboardStats {
  totalEmployees: number;
  newEmployeesThisMonth: number;
  totalProjects: number;
  activeProjects: number;
  inactiveProjects: number;
  totalTasks: number;
  totalSubtasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasksInProgress: number;
  completionRate: number;
  completionTrend: number;
  totalJobOffers?: number;
  activeJobOffers?: number;
  totalApplications?: number;
  newApplications?: number;
  spontaneousApplications?: number;
  interviewApplications?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeSection: string = 'dashboard';
  loading = false;
  Math = Math; // Expose Math object to template
  destroy$ = new Subject<void>();

  // Nouvelles propriétés pour les fonctionnalités avancées
  hasNewData: boolean = false;
  newDataCount: number = 0;
  weeklyStats: any = {
    tasksCompleted: 0,
    employeeProductivity: 0,
    weeklyGrowth: 0
  };
  
  monthlyTrends: any = {
    taskCompletion: [],
    projectProgress: [],
    employeePerformance: []
  };
  
  realTimeMetrics: any = {
    activeUsers: 0,
    ongoingTasks: 0,
    systemLoad: 0
  };

  stats: DashboardStats = {
    totalEmployees: 0,
    newEmployeesThisMonth: 0,
    totalProjects: 0,
    activeProjects: 0,
    inactiveProjects: 0,
    totalTasks: 0,
    totalSubtasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    tasksInProgress: 0,
    completionRate: 0,
    completionTrend: 0
  };

  recentProjects: Project[] = [];
  tasksByUser: any[] = [];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private workHoursService: EmployeeWorkHoursService,
    private socketService: SocketService,
    private jobService: JobService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupSocketListeners();
    
    // Actualiser les données toutes les 5 minutes
    interval(300000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadDashboardData();
    });
  }

  private setupSocketListeners(): void {
    // Écouter les mises à jour de sessions de travail
    this.socketService.getWorkSessionUpdates().pipe(takeUntil(this.destroy$)).subscribe(update => {
      if (update) {
        this.handleWorkSessionUpdate(update);
      }
    });

    // Écouter les mises à jour des statistiques admin
    this.socketService.getAdminStatsUpdates().pipe(takeUntil(this.destroy$)).subscribe(stats => {
      if (stats) {
        this.handleAdminStatsUpdate(stats);
      }
    });

    // Demander une mise à jour des statistiques au démarrage
    this.socketService.requestStatsUpdate();
  }

  private handleWorkSessionUpdate(update: any): void {
    console.log('🔄 [Admin Dashboard] Mise à jour session reçue:', update);
    
    // Recharger les données du dashboard pour avoir les informations à jour
    this.loadDashboardData();
    
    // Mettre à jour les statistiques en temps réel selon le type d'événement
    switch (update.type) {
      case 'session_started':
        this.realTimeMetrics.activeUsers = (this.realTimeMetrics.activeUsers || 0) + 1;
        break;
      case 'session_ended':
        this.realTimeMetrics.activeUsers = Math.max((this.realTimeMetrics.activeUsers || 1) - 1, 0);
        break;
    }
  }

  private handleAdminStatsUpdate(stats: any): void {
    console.log('📈 [Admin Dashboard] Mise à jour statistiques admin:', stats);
    
    // Mettre à jour les statistiques du dashboard
    if (stats.active_sessions !== undefined) {
      this.realTimeMetrics.activeUsers = stats.active_sessions;
    }
    if (stats.total_hours_today !== undefined) {
      this.realTimeMetrics.ongoingTasks = stats.total_hours_today;
    }
    if (stats.employees_on_break !== undefined) {
      this.realTimeMetrics.systemLoad = stats.employees_on_break;
    }
  }

  loadDashboardData() {
    this.loading = true;

    // Charger les statistiques des employés
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        console.log('Réponse employés:', response);
        const employees = response.results || response;
        this.stats.totalEmployees = Array.isArray(employees) ? employees.length : response.count || 0;

        if (Array.isArray(employees)) {
          // Calculer les nouveaux employés ce mois
          const thisMonth = new Date();
          thisMonth.setDate(1);
          this.stats.newEmployeesThisMonth = employees.filter((emp: any) =>
            new Date(emp.created_at || emp.date_joined) >= thisMonth
          ).length;
        }
        console.log('Stats employés mises à jour:', this.stats.totalEmployees);
      },
      error: (error) => {
        console.error('Erreur chargement employés:', error);
        alert('Erreur lors du chargement des employés: ' + (error.message || 'Erreur inconnue'));
      }
    });

    // Charger les statistiques des projets
    this.projectService.getProjects().subscribe({
      next: (response) => {
        console.log('Réponse projets:', response);
        const projects = response.results || response;
        this.stats.totalProjects = Array.isArray(projects) ? projects.length : response.count || 0;

        if (Array.isArray(projects)) {
          this.stats.activeProjects = projects.filter((p: any) => p.status === 'EN_COURS').length;
          this.stats.inactiveProjects = projects.filter((p: any) => p.status !== 'EN_COURS').length;

          // Projets récents (5 derniers)
          this.recentProjects = projects.slice(0, 5).map((p: any) => ({
            title: p.title,
            description: p.description,
            status: p.status.toLowerCase()
          }));
        }
        console.log('Stats projets mises à jour:', this.stats.totalProjects);
      },
      error: (error) => {
        console.error('Erreur chargement projets:', error);
        alert('Erreur lors du chargement des projets: ' + (error.message || 'Erreur inconnue'));
      }
    });

    // Charger les statistiques des tâches
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Réponse tâches:', tasks);
        this.stats.totalTasks = Array.isArray(tasks) ? tasks.length : 0;

        if (Array.isArray(tasks)) {
          this.stats.completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'TERMINEE').length;
          this.stats.pendingTasks = tasks.filter((t: any) => t.status === 'TODO' || t.status === 'A_FAIRE').length;
          this.stats.tasksInProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'EN_COURS').length;

          // Calculer le taux de completion
          this.stats.completionRate = this.stats.totalTasks > 0
            ? Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100)
            : 0;

          // Simuler la tendance (à remplacer par vraies données historiques)
          this.stats.completionTrend = Math.floor(Math.random() * 10) - 5;

          // Compter les sous-tâches
          this.stats.totalSubtasks = tasks.reduce((count: number, task: any) =>
            count + (task.subtasks ? task.subtasks.length : 0), 0
          );

          // Statistiques par utilisateur
          this.calculateTasksByUser(tasks);
        }
        console.log('Stats tâches mises à jour:', this.stats.totalTasks);
      },
      error: (error) => {
        console.error('Erreur chargement tâches:', error);
        alert('Erreur lors du chargement des tâches: ' + (error.message || 'Erreur inconnue'));
      }
    });

    // Charger les statistiques des jobs et candidatures
    this.jobService.getJobStats().subscribe({
      next: (jobStats) => {
        console.log('Statistiques jobs:', jobStats);
        this.stats.totalJobOffers = (jobStats as any).total_offers || 0;
        this.stats.activeJobOffers = (jobStats as any).active_offers || 0;
        this.stats.totalApplications = (jobStats as any).total_applications || 0;
        this.stats.newApplications = (jobStats as any).new_applications || 0;
        this.stats.spontaneousApplications = (jobStats as any).spontaneous_applications || 0;
        this.stats.interviewApplications = (jobStats as any).interview_applications || 0;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques jobs:', error);
        // Valeurs par défaut en cas d'erreur
        this.stats.totalJobOffers = 0;
        this.stats.activeJobOffers = 0;
        this.stats.totalApplications = 0;
        this.stats.newApplications = 0;
        this.stats.spontaneousApplications = 0;
        this.stats.interviewApplications = 0;
      }
    });

    this.loading = false;
    
    // Calculer les métriques avancées après le chargement des données
    this.calculateAdvancedMetrics();
    this.loadRealTimeMetrics();
  }

  calculateTasksByUser(tasks: any[]) {
    const userStats: { [key: string]: any } = {};

    tasks.forEach(task => {
      if (task.assigned_to) {
        const userId = task.assigned_to.id || task.assigned_to;
        const userName = task.assigned_to.username || `Utilisateur ${userId}`;

        if (!userStats[userId]) {
          userStats[userId] = {
            name: userName,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0
          };
        }

        userStats[userId].total++;
        if (task.status === 'COMPLETED' || task.status === 'TERMINEE') userStats[userId].completed++;
        else if (task.status === 'IN_PROGRESS' || task.status === 'EN_COURS') userStats[userId].inProgress++;
        else if (task.status === 'TODO' || task.status === 'A_FAIRE') userStats[userId].pending++;
      }
    });

    this.tasksByUser = Object.values(userStats);
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  private generateCSVReport(data: any): string {
    let csv = 'Rapport Dashboard Segus Engineering\n';
    csv += `Date: ${data.date}\n\n`;

    csv += 'STATISTIQUES GENERALES\n';
    csv += 'Métrique,Valeur\n';
    csv += `Employés Total,${data.stats.totalEmployees}\n`;
    csv += `Nouveaux Employés ce Mois,${data.stats.newEmployeesThisMonth}\n`;
    csv += `Projets Total,${data.stats.totalProjects}\n`;
    csv += `Projets Actifs,${data.stats.activeProjects}\n`;
    csv += `Projets Inactifs,${data.stats.inactiveProjects}\n`;
    csv += `Tâches Total,${data.stats.totalTasks}\n`;
    csv += `Sous-tâches Total,${data.stats.totalSubtasks}\n`;
    csv += `Tâches Terminées,${data.stats.completedTasks}\n`;
    csv += `Tâches En Cours,${data.stats.tasksInProgress}\n`;
    csv += `Tâches À Faire,${data.stats.pendingTasks}\n`;
    csv += `Taux de Completion,${data.stats.completionRate}%\n\n`;

    csv += 'TACHES PAR UTILISATEUR\n';
    csv += 'Utilisateur,Total,Terminées,En Cours,À Faire\n';
    data.tasksByUser.forEach((user: any) => {
      csv += `${user.name},${user.total},${user.completed},${user.inProgress},${user.pending}\n`;
    });

    return csv;
  }

  getStatusLabel(status: string) {
    const statusMap: { [key: string]: string } = {
      'EN_COURS': 'Actif',
      'TERMINE': 'Terminé',
      'SUSPENDU': 'Suspendu',
      'actif': 'Actif',
      'termine': 'Terminé',
      'suspendu': 'Suspendu'
    };
    return statusMap[status] || status;
  }

  // Nouvelles méthodes pour les fonctionnalités avancées
  getTaskEfficiency(): number {
    if (this.stats.totalTasks === 0) return 0;
    return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
  }

  exportData(): void {
    const data = {
      stats: this.stats,
      tasksByUser: this.tasksByUser,
      recentProjects: this.recentProjects,
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(data, 'dashboard-data');
  }

  getRecentActivities() {
    // Simuler des activités récentes basées sur les données disponibles
    const activities = [];
    
    if (this.recentProjects.length > 0) {
      activities.push({
        type: 'project',
        icon: 'fa-project-diagram',
        text: `Nouveau projet créé: ${this.recentProjects[0].title}`,
        time: 'Il y a 2 heures'
      });
    }
    
    if (this.stats.completedTasks > 0) {
      activities.push({
        type: 'task',
        icon: 'fa-check-circle',
        text: `${this.stats.completedTasks} tâches terminées aujourd'hui`,
        time: 'Il y a 1 heure'
      });
    }
    
    if (this.tasksByUser.length > 0) {
      const topUser = this.tasksByUser[0];
      activities.push({
        type: 'user',
        icon: 'fa-user-check',
        text: `${topUser.name} a terminé une nouvelle tâche`,
        time: 'Il y a 30 minutes'
      });
    }
    
    activities.push({
      type: 'system',
      icon: 'fa-sync-alt',
      text: 'Synchronisation des données terminée',
      time: 'Il y a 5 minutes'
    });
    
    return activities.slice(0, 5); // Limiter à 5 activités
  }

  getTopPerformers() {
    // Trier les utilisateurs par taux de complétion et nombre total de tâches
    return this.tasksByUser
      .sort((a, b) => {
        const rateA = (a.completed / a.total) * 100;
        const rateB = (b.completed / b.total) * 100;
        
        // Trier d'abord par taux de complétion, puis par nombre total
        if (rateB !== rateA) {
          return rateB - rateA;
        }
        return b.total - a.total;
      })
      .slice(0, 5); // Top 5 performers
  }

  // Méthodes pour les statistiques par état
  getTaskPercentage(status: string): number {
    if (this.stats.totalTasks === 0) return 0;
    
    switch (status) {
      case 'pending':
        return (this.stats.pendingTasks / this.stats.totalTasks) * 100;
      case 'in_progress':
        return (this.stats.tasksInProgress / this.stats.totalTasks) * 100;
      case 'completed':
        return (this.stats.completedTasks / this.stats.totalTasks) * 100;
      default:
        return 0;
    }
  }

  getProjectPercentage(status: string): number {
    if (this.stats.totalProjects === 0) return 0;
    
    switch (status) {
      case 'active':
        return Math.round((this.stats.activeProjects / this.stats.totalProjects) * 100);
      case 'inactive':
        return Math.round((this.stats.inactiveProjects / this.stats.totalProjects) * 100);
      default:
        return 0;
    }
  }

  // Méthodes d'export pour les différentes sections
  exportTasksByStatus(): void {
    const tasksByStatus = {
      pending: {
        count: this.stats.pendingTasks,
        percentage: this.getTaskPercentage('pending')
      },
      inProgress: {
        count: this.stats.tasksInProgress,
        percentage: this.getTaskPercentage('in_progress')
      },
      completed: {
        count: this.stats.completedTasks,
        percentage: this.getTaskPercentage('completed')
      },
      total: this.stats.totalTasks,
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(tasksByStatus, 'statistiques-taches-par-etat');
  }

  exportProjectsStatus(): void {
    const projectsStatus = {
      active: {
        count: this.stats.activeProjects,
        percentage: this.getProjectPercentage('active')
      },
      inactive: {
        count: this.stats.inactiveProjects,
        percentage: this.getProjectPercentage('inactive')
      },
      total: this.stats.totalProjects,
      recentProjects: this.recentProjects,
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(projectsStatus, 'etat-des-projets');
  }

  exportUserStats(): void {
    const userStats = {
      topPerformers: this.getTopPerformers(),
      allUsers: this.tasksByUser,
      totalUsers: this.tasksByUser.length,
      averageTasksPerUser: this.tasksByUser.length > 0 ? 
        Math.round(this.tasksByUser.reduce((sum, user) => sum + user.total, 0) / this.tasksByUser.length) : 0,
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(userStats, 'statistiques-utilisateurs');
  }

  // Méthode pour télécharger différents types de rapports
  downloadReport(type: string): void {
    switch (type) {
      case 'tasks':
        this.generateTasksReport();
        break;
      case 'projects':
        this.generateProjectsReport();
        break;
      case 'users':
        this.generateUsersReport();
        break;
      case 'complete':
        this.generateCompleteReport();
        break;
      default:
        console.warn('Type de rapport non reconnu:', type);
    }
  }

  private generateTasksReport(): void {
    const tasksReport = {
      summary: {
        totalTasks: this.stats.totalTasks,
        completedTasks: this.stats.completedTasks,
        tasksInProgress: this.stats.tasksInProgress,
        pendingTasks: this.stats.pendingTasks,
        completionRate: this.stats.completionRate
      },
      tasksByStatus: {
        pending: this.getTaskPercentage('pending'),
        inProgress: this.getTaskPercentage('in_progress'),
        completed: this.getTaskPercentage('completed')
      },
      tasksByUser: this.tasksByUser,
      generatedAt: new Date().toISOString(),
      reportType: 'Rapport des Tâches'
    };

    this.downloadJSON(tasksReport, 'rapport-taches');
  }

  private generateProjectsReport(): void {
    const projectsReport = {
      summary: {
        totalProjects: this.stats.totalProjects,
        activeProjects: this.stats.activeProjects,
        inactiveProjects: this.stats.inactiveProjects,
        activePercentage: this.getProjectPercentage('active'),
        inactivePercentage: this.getProjectPercentage('inactive')
      },
      recentProjects: this.recentProjects,
      generatedAt: new Date().toISOString(),
      reportType: 'Rapport des Projets'
    };

    this.downloadJSON(projectsReport, 'rapport-projets');
  }

  private generateUsersReport(): void {
    const usersReport = {
      summary: {
        totalUsers: this.stats.totalEmployees,
        newUsersThisMonth: this.stats.newEmployeesThisMonth,
        averageProductivity: this.getAverageProductivity()
      },
      topPerformers: this.getTopPerformers(),
      allUsers: this.tasksByUser,
      weeklyStats: this.weeklyStats,
      generatedAt: new Date().toISOString(),
      reportType: 'Rapport des Utilisateurs'
    };

    this.downloadJSON(usersReport, 'rapport-utilisateurs');
  }

  private generateCompleteReport(): void {
    const completeReport = {
      dashboard: {
        stats: this.stats,
        weeklyStats: this.weeklyStats,
        monthlyTrends: this.monthlyTrends,
        realTimeMetrics: this.realTimeMetrics
      },
      tasks: {
        byStatus: {
          pending: { count: this.stats.pendingTasks, percentage: this.getTaskPercentage('pending') },
          inProgress: { count: this.stats.tasksInProgress, percentage: this.getTaskPercentage('in_progress') },
          completed: { count: this.stats.completedTasks, percentage: this.getTaskPercentage('completed') }
        },
        byUser: this.tasksByUser
      },
      projects: {
        summary: {
          total: this.stats.totalProjects,
          active: this.stats.activeProjects,
          inactive: this.stats.inactiveProjects
        },
        recent: this.recentProjects
      },
      users: {
        total: this.stats.totalEmployees,
        new: this.stats.newEmployeesThisMonth,
        topPerformers: this.getTopPerformers(),
        productivity: this.getAverageProductivity()
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType: 'Rapport Complet OBT',
        version: '1.0',
        format: 'JSON'
      }
    };

    this.downloadJSON(completeReport, 'rapport-complet-obt');
  }

  private downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Notification de succès
    console.log(`Rapport ${filename} téléchargé avec succès`);
  }

  calculateAdvancedMetrics(): void {
    // Calculer les métriques hebdomadaires
    this.weeklyStats = {
      tasksCompleted: Math.floor(this.stats.completedTasks * 0.3),
      projectsStarted: Math.floor(this.stats.activeProjects * 0.2),
      employeeProductivity: this.getAverageProductivity(),
      weeklyGrowth: this.calculateWeeklyGrowth()
    };

    // Calculer les tendances mensuelles
    this.monthlyTrends = {
      taskCompletionTrend: this.stats.completionTrend,
      employeeGrowthTrend: this.stats.newEmployeesThisMonth > 0 ? 'positive' : 'stable',
      projectSuccessRate: this.calculateProjectSuccessRate(),
      overallPerformance: this.calculateOverallPerformance()
    };

    // Simuler de nouvelles données
    this.hasNewData = Math.random() > 0.7;
    this.newDataCount = this.hasNewData ? Math.floor(Math.random() * 5) + 1 : 0;
  }

  getAverageProductivity(): number {
    if (this.tasksByUser.length === 0) return 0;
    const totalProductivity = this.tasksByUser.reduce((sum, user) => {
      return sum + (user.completed / user.total) * 100;
    }, 0);
    return Math.round(totalProductivity / this.tasksByUser.length);
  }

  calculateWeeklyGrowth(): number {
    // Simulation d'une croissance hebdomadaire
    return Math.floor(Math.random() * 20) - 10; // Entre -10% et +10%
  }

  calculateProjectSuccessRate(): number {
    if (this.stats.totalProjects === 0) return 0;
    return Math.round((this.stats.activeProjects / this.stats.totalProjects) * 100);
  }

  getApplicationPercentage(type: string): number {
    const total = this.stats.totalApplications || 0;
    if (total === 0) return 0;
    
    switch (type) {
      case 'new':
        return Math.round(((this.stats.newApplications || 0) / total) * 100);
      case 'spontaneous':
        return Math.round(((this.stats.spontaneousApplications || 0) / total) * 100);
      case 'interview':
        return Math.round(((this.stats.interviewApplications || 0) / total) * 100);
      default:
        return 0;
    }
  }

  calculateOverallPerformance(): string {
    const efficiency = this.getTaskEfficiency();
    const successRate = this.calculateProjectSuccessRate();
    const avgScore = (efficiency + successRate) / 2;
    
    if (avgScore >= 80) return 'Excellent';
    if (avgScore >= 60) return 'Bon';
    if (avgScore >= 40) return 'Moyen';
    return 'À améliorer';
  }

  loadRealTimeMetrics(): void {
    // Simuler des métriques en temps réel
    this.realTimeMetrics = {
      activeUsers: Math.floor(Math.random() * 10) + 1,
      ongoingTasks: this.stats.tasksInProgress,
      systemLoad: Math.floor(Math.random() * 100)
    };
  }
}
