import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, Task, TaskStatus, Priority, SubTask, UserSimple } from '../../../models/project.model';

interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
  color: string;
}

interface TaskComment {
  id: number;
  text: string;
  author: UserSimple;
  created_at: string;
}

interface TaskAttachment {
  id: number;
  name: string;
  url: string;
  size: string;
  type: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  @Input() project!: Project;

  // Onglets de vue
  activeTab: 'overview' | 'kanban' | 'gantt' | 'list' = 'overview';

  // Vue Kanban
  kanbanColumns: KanbanColumn[] = [
    { id: 'todo', title: 'À faire', status: TaskStatus.TODO, tasks: [], color: '#6b7280' },
    { id: 'in_progress', title: 'En cours', status: TaskStatus.IN_PROGRESS, tasks: [], color: '#3b82f6' },
    { id: 'completed', title: 'Terminé', status: TaskStatus.COMPLETED, tasks: [], color: '#10b981' },
    { id: 'blocked', title: 'Bloqué', status: TaskStatus.BLOCKED, tasks: [], color: '#ef4444' }
  ];

  // Vue Gantt
  ganttStartDate: Date = new Date();
  ganttEndDate: Date = new Date();
  ganttScale: 'day' | 'week' | 'month' = 'week';

  // Vue Liste
  sortField: string = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtres
  searchTerm: string = '';
  selectedPriority: string = '';
  selectedAssignee: string = '';

  // Modal de tâche
  showTaskModal: boolean = false;
  editingTask: Task | null = null;
  newTask: Partial<Task> = {};

  // Commentaires et pièces jointes
  selectedTask: Task | null = null;
  newComment: string = '';

  // Données simulées
  tasks: Task[] = [];
  employees: UserSimple[] = [];

  ngOnInit() {
    this.loadTasks();
    this.loadEmployees();
    this.organizeKanbanTasks();
    this.calculateGanttDates();
  }

  loadTasks() {
    // Simulation de données - à remplacer par un vrai service
    this.tasks = [
      {
        id: 1,
        title: 'Conception de l\'interface utilisateur',
        description: 'Créer les maquettes et prototypes de l\'interface',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        start_date: '2024-01-20',
        end_date: '2024-02-15',
        project: this.project.id,
        assigned_employees: [
          { id: 1, username: 'john.doe', email: 'john@example.com', role: 'EMPLOYE', full_name: 'John Doe' }
        ],
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
        subtasks: [
          {
            id: 1,
            section_name: 'Page d\'accueil',
            section_number: 'UI-001',
            section_id: 'HOME',
            kilometrage: 0,
            is_completed: true,
            completed_at: '2024-01-25T00:00:00Z',
            task: 1,
            assigned_employees: [],
            created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
            created_at: '2024-01-20T00:00:00Z',
            updated_at: '2024-01-25T00:00:00Z'
          },
          {
            id: 2,
            section_name: 'Page de connexion',
            section_number: 'UI-002',
            section_id: 'LOGIN',
            kilometrage: 0,
            is_completed: false,
            completed_at: null,
            task: 1,
            assigned_employees: [],
            created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
            created_at: '2024-01-20T00:00:00Z',
            updated_at: '2024-01-20T00:00:00Z'
          }
        ],
        progress_percentage: 50,
        total_subtasks: 2,
        completed_subtasks: 1,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z'
      },
      {
        id: 2,
        title: 'Développement backend',
        description: 'Implémenter les API et la logique métier',
        status: TaskStatus.TODO,
        priority: Priority.VERY_HIGH,
        start_date: '2024-02-01',
        end_date: '2024-04-30',
        project: this.project.id,
        assigned_employees: [
          { id: 2, username: 'jane.smith', email: 'jane@example.com', role: 'EMPLOYE', full_name: 'Jane Smith' }
        ],
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
        subtasks: [],
        progress_percentage: 0,
        total_subtasks: 0,
        completed_subtasks: 0,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
      },
      {
        id: 3,
        title: 'Tests et déploiement',
        description: 'Tests unitaires, d\'intégration et déploiement en production',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        start_date: '2024-05-01',
        end_date: '2024-06-15',
        project: this.project.id,
        assigned_employees: [
          { id: 3, username: 'mike.wilson', email: 'mike@example.com', role: 'EMPLOYE', full_name: 'Mike Wilson' }
        ],
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
        subtasks: [],
        progress_percentage: 0,
        total_subtasks: 0,
        completed_subtasks: 0
      }
    ];
  }

  loadEmployees() {
    this.employees = [
      { id: 1, username: 'john.doe', email: 'john@example.com', role: 'EMPLOYE', full_name: 'John Doe' },
      { id: 2, username: 'jane.smith', email: 'jane@example.com', role: 'EMPLOYE', full_name: 'Jane Smith' },
      { id: 3, username: 'mike.wilson', email: 'mike@example.com', role: 'EMPLOYE', full_name: 'Mike Wilson' },
      { id: 4, username: 'sarah.jones', email: 'sarah@example.com', role: 'EMPLOYE', full_name: 'Sarah Jones' }
    ];
  }

  organizeKanbanTasks() {
    this.kanbanColumns.forEach(column => {
      column.tasks = this.tasks.filter(task => task.status === column.status);
    });
  }

  calculateGanttDates() {
    if (this.tasks.length > 0) {
      const startDates = this.tasks.map(t => new Date(t.start_date));
      const endDates = this.tasks.map(t => new Date(t.end_date));

      this.ganttStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
      this.ganttEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));
    }
  }

  // Navigation entre onglets
  setActiveTab(tab: 'overview' | 'kanban' | 'gantt' | 'list') {
    this.activeTab = tab;
  }

  // Gestion des tâches Kanban
  onTaskDrop(event: any, targetStatus: TaskStatus) {
    const taskId = event.data;
    const task = this.tasks.find(t => t.id === taskId);

    if (task) {
      task.status = targetStatus;
      this.organizeKanbanTasks();
      // Ici, vous appelleriez le service pour mettre à jour la tâche
    }
  }

  // Gestion des tâches
  openTaskModal(task?: Task) {
    if (task) {
      this.editingTask = task;
      this.newTask = { ...task };
    } else {
      this.editingTask = null;
      this.newTask = {
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        start_date: '',
        end_date: '',
        project: this.project.id,
        assigned_employees: []
      };
    }
    this.showTaskModal = true;
  }

  saveTask() {
    if (this.editingTask) {
      // Mise à jour d'une tâche existante
      Object.assign(this.editingTask, this.newTask);
    } else {
      // Création d'une nouvelle tâche
      const newTask: Task = {
        id: Date.now(), // ID temporaire
        ...this.newTask as Task,
        status: TaskStatus.TODO,
        progress_percentage: 0,
        total_subtasks: 0,
        completed_subtasks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', full_name: 'Admin' },
        subtasks: []
      };
      this.tasks.push(newTask);
    }

    this.organizeKanbanTasks();
    this.showTaskModal = false;
    this.editingTask = null;
    this.newTask = {};
  }

  deleteTask(taskId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.organizeKanbanTasks();
    }
  }

  // Gestion des sous-tâches
  toggleSubtask(subtask: SubTask) {
    subtask.is_completed = !subtask.is_completed;
    if (subtask.is_completed) {
      subtask.completed_at = new Date().toISOString();
    } else {
      subtask.completed_at = null;
    }

    // Mettre à jour la progression de la tâche parent
    const parentTask = this.tasks.find(t => t.id === subtask.task);
    if (parentTask) {
      const completedSubtasks = parentTask.subtasks.filter(st => st.is_completed).length;
      parentTask.completed_subtasks = completedSubtasks;
      parentTask.progress_percentage = Math.round((completedSubtasks / parentTask.subtasks.length) * 100);
    }
  }

  // Utilitaires
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      [TaskStatus.TODO]: 'À faire',
      [TaskStatus.IN_PROGRESS]: 'En cours',
      [TaskStatus.COMPLETED]: 'Terminé',
      [TaskStatus.BLOCKED]: 'Bloqué'
    };
    return statusMap[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      [Priority.VERY_LOW]: 'Très basse',
      [Priority.LOW]: 'Basse',
      [Priority.MEDIUM]: 'Moyenne',
      [Priority.HIGH]: 'Haute',
      [Priority.VERY_HIGH]: 'Très haute'
    };
    return priorityMap[priority] || priority;
  }

  getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      [Priority.VERY_LOW]: '#64748b',
      [Priority.LOW]: '#06b6d4',
      [Priority.MEDIUM]: '#eab308',
      [Priority.HIGH]: '#f97316',
      [Priority.VERY_HIGH]: '#dc2626'
    };
    return colorMap[priority] || '#64748b';
  }

  isTaskOverdue(task: Task): boolean {
    const today = new Date();
    const endDate = new Date(task.end_date);
    return endDate < today && task.status !== TaskStatus.COMPLETED;
  }

  isTaskDueSoon(task: Task, daysThreshold: number = 3): boolean {
    const today = new Date();
    const endDate = new Date(task.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= daysThreshold && diffDays >= 0 && task.status !== TaskStatus.COMPLETED;
  }

  // Filtres et tri
  get filteredTasks(): Task[] {
    let filtered = [...this.tasks];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    if (this.selectedPriority) {
      filtered = filtered.filter(t => t.priority === this.selectedPriority);
    }

    if (this.selectedAssignee) {
      filtered = filtered.filter(t =>
        t.assigned_employees.some(emp => emp.id.toString() === this.selectedAssignee)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Task];
      let bValue: any = b[this.sortField as keyof Task];

      if (this.sortField === 'start_date' || this.sortField === 'end_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedPriority = '';
    this.selectedAssignee = '';
  }

  // Méthodes pour le Gantt
  getTimelineDates(): Date[] {
    const dates: Date[] = [];
    const current = new Date(this.ganttStartDate);
    const end = new Date(this.ganttEndDate);

    while (current <= end) {
      dates.push(new Date(current));

      if (this.ganttScale === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (this.ganttScale === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates;
  }

  getTaskPosition(task: Task): number {
    const startDate = new Date(task.start_date);
    const projectStart = new Date(this.ganttStartDate);
    const totalDuration = this.ganttEndDate.getTime() - this.ganttStartDate.getTime();
    const taskStart = startDate.getTime() - projectStart.getTime();

    return Math.max(0, (taskStart / totalDuration) * 100);
  }

  getTaskWidth(task: Task): number {
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    const totalDuration = this.ganttEndDate.getTime() - this.ganttStartDate.getTime();
    const taskDuration = endDate.getTime() - startDate.getTime();

    return Math.min(100, (taskDuration / totalDuration) * 100);
  }

  // Méthodes utilitaires pour les filtres
  getOverdueTasksCount(): number {
    return this.tasks.filter(task => this.isTaskOverdue(task)).length;
  }

  getDueSoonTasks(): Task[] {
    return this.tasks.filter(task => !this.isTaskOverdue(task) && this.isTaskDueSoon(task)).slice(0, 5);
  }
}
