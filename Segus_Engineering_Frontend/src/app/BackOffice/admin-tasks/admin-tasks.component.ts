import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { EmployeeService } from '../../services/employee.service';
import {
  Task,
  SubTask,
  TaskStatus,
  Priority,
  CreateTask,
  UpdateTask,
  CreateSubTask,
  UpdateSubTask,
  TaskFilter,
  TaskStats
} from '../../models/project.model';
import { Project, UserSimple } from '../../models/project.model';

@Component({
  selector: 'app-admin-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tasks.component.html',
  styleUrls: ['./admin-tasks.component.css']
})
export class AdminTasksComponent implements OnInit {
  // Propriétés de données
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  projects: Project[] = [];
  employees: UserSimple[] = [];

  // Enum pour le template
  TaskStatus = TaskStatus;
  Priority = Priority;

  // Math pour le template
  Math = Math;

  // Propriétés de vue
  viewMode: 'grid' | 'list' = 'grid';
  activeTab: string = 'all';

  // Propriétés de filtrage et recherche
  searchTerm: string = '';
  selectedStatus: TaskStatus | '' = '';
  selectedPriority: Priority | '' = '';
  selectedProject: number | '' = '';
  selectedAssignee: number | '' = '';
  dueDateFilter: string = '';

  // Propriétés de tri
  sortField: string = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Propriétés de pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalItems: number = 0;
  totalPages: number = 0;

  // Propriétés du menu contextuel
  selectedTask: Task | null = null;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  showContextMenu: boolean = false;

  // Propriétés des modales
  showCreateTaskModal: boolean = false;
  showEditTaskModal: boolean = false;
  showCreateSubtaskModal: boolean = false;
  showEditSubtaskModal: boolean = false;
  showAssignModal: boolean = false;
  showDeleteModal: boolean = false;

  // Propriétés des formulaires
  createTaskForm: CreateTask = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    project: 0,
    start_date: '',
    end_date: '',
    estimated_hours: 0,
    assigned_employee_ids: []
  };

  editTaskForm: UpdateTask = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    start_date: '',
    end_date: '',
    assigned_employee_ids: []
  };

  createSubtaskForm: CreateSubTask = {
    section_name: '',
    section_number: '',
    section_id: '',
    kilometrage: 0,
    task: 0,
    assigned_employee_ids: []
  };

  editSubtaskForm: UpdateSubTask = {
    section_name: '',
    section_number: '',
    section_id: '',
    kilometrage: 0,
    assigned_employee_ids: []
  };

  // Propriétés de chargement
  loading: boolean = false;
  loadingStats: boolean = false;

  // Statistiques
  taskStats: TaskStats = {
    totalTasks: 0,
    completedTasks: 0,
    progressPercentage: 0,
    totalEmployees: 0,
    tasksInProgress: 0,
    tasksTodo: 0,
    tasksBlocked: 0
  };

  // État interne pour l'édition de sous-tâche
  editingSubtaskId: number | null = null;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit() {
    this.loadTasks();
    this.loadProjects();
    this.loadEmployees();
    this.calculateStats();
  }

  // Chargement des données
  loadTasks() {
    this.loading = true;
    const filters: any = {
      status: this.selectedStatus || undefined,
      project: this.selectedProject || undefined,
      employee: this.selectedAssignee || undefined,
    };
    this.taskService.getTasks(filters).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filteredTasks = tasks;
        this.totalItems = tasks.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des tâches:', error);
        this.loading = false;
      }
    });
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (response) => {
        this.projects = response.results || [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des projets:', error);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        this.employees = (response.results || []).map((emp: any) => ({
          id: emp.id, // Use Employee ID for assignment (will be converted in backend)
          username: emp.user?.username || emp.username,
          email: emp.user?.email || emp.email,
          role: emp.user?.role || emp.role || 'EMPLOYE',
          full_name: emp.user?.full_name || emp.full_name || `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim()
        }));
        console.log('TASK DEBUG: Employees loaded:', this.employees);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
      }
    });
  }

  calculateStats() {
    this.loadingStats = true;
    // Pour l'instant, utilisons des statistiques simulées
    this.taskStats = {
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      totalEmployees: 0,
      tasksInProgress: 0,
      tasksTodo: 0,
      tasksBlocked: 0
    };
    this.loadingStats = false;
    // TODO: Implémenter l'appel réel au service quand il sera disponible
  }

  // Filtrage et recherche
  applyFilters() {
    this.currentPage = 1;
    this.loadTasks();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.selectedProject = '';
    this.selectedAssignee = '';
    this.dueDateFilter = '';
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  // Tri
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Pagination
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Gestion des tâches
  createTask() {
    this.loading = true;
    this.taskService.createTask(this.createTaskForm).subscribe({
      next: (task) => {
        this.tasks.unshift(task);
        this.filteredTasks = [...this.tasks];
        this.showCreateTaskModal = false;
        this.resetCreateTaskForm();
        this.calculateStats();
        this.loading = false;
        // Afficher un message de succès
      },
      error: (error) => {
        console.error('Erreur lors de la création de la tâche:', error);
        this.loading = false;
        // Afficher un message d'erreur
      }
    });
  }

  editTask() {
    if (!this.selectedTask) return;

    this.loading = true;
    this.taskService.updateTask(this.selectedTask.id, this.editTaskForm).subscribe({
      next: (updatedTask) => {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          this.filteredTasks = [...this.tasks];
        }
        this.showEditTaskModal = false;
        this.selectedTask = null;
        this.calculateStats();
        this.loading = false;
        // Afficher un message de succès
      },
      error: (error) => {
        console.error('Erreur lors de la modification de la tâche:', error);
        this.loading = false;
        // Afficher un message d'erreur
      }
    });
  }

  deleteTask(taskId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.loading = true;
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
          this.filteredTasks = [...this.tasks];
          this.showDeleteModal = false;
          this.selectedTask = null;
          this.calculateStats();
          this.loading = false;
          // Afficher un message de succès
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la tâche:', error);
          this.loading = false;
          // Afficher un message d'erreur
        }
      });
    }
  }

  assignEmployees() {
    if (!this.selectedTask) return;

    this.loading = true;
    const employeeIds = this.editTaskForm.assigned_employee_ids || [];

    this.taskService.assignEmployeesToTask(this.selectedTask.id, employeeIds).subscribe({
      next: (updatedTask) => {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          this.filteredTasks = [...this.tasks];
        }
        this.showAssignModal = false;
        this.selectedTask = null;
        this.loading = false;
        // Afficher un message de succès
      },
      error: (error) => {
        console.error('Erreur lors de l\'assignation des employés:', error);
        this.loading = false;
        // Afficher un message d'erreur
      }
    });
  }

  duplicateTask(task: Task) {
    this.createTaskForm = {
      title: `${task.title} (Copie)`,
      description: task.description,
      status: TaskStatus.TODO,
      priority: task.priority,
      project: task.project,
      start_date: '',
      end_date: '',
      assigned_employee_ids: task.assigned_employees.map(e => e.id)
    };
    this.showCreateTaskModal = true;
  }

  // Gestion des sous-tâches
  createSubtask() {
    this.loading = true;
    this.taskService.createSubtask(this.createSubtaskForm).subscribe({
      next: (subtask) => {
        // Mettre à jour la tâche parente
        if (this.selectedTask) {
          this.selectedTask.subtasks.push(subtask);
          this.updateTaskProgress(this.selectedTask);
        }
        this.showCreateSubtaskModal = false;
        this.resetCreateSubtaskForm();
        this.loading = false;
        // Afficher un message de succès
      },
      error: (error) => {
        console.error('Erreur lors de la création de la sous-tâche:', error);
        this.loading = false;
        // Afficher un message d'erreur
      }
    });
  }

  editSubtask() {
    if (!this.selectedTask || this.editingSubtaskId === null) return;

    this.loading = true;
    this.taskService.updateSubtask(this.editingSubtaskId!, this.editSubtaskForm).subscribe({
      next: (updatedSubtask) => {
        // Mettre à jour la sous-tâche dans la tâche parente
        if (this.selectedTask) {
          const index = this.selectedTask.subtasks.findIndex(st => st.id === updatedSubtask.id);
          if (index !== -1) {
            this.selectedTask.subtasks[index] = updatedSubtask;
            this.updateTaskProgress(this.selectedTask);
          }
        }
        this.showEditSubtaskModal = false;
        this.editingSubtaskId = null;
        this.loading = false;
        // Afficher un message de succès
      },
      error: (error) => {
        console.error('Erreur lors de la modification de la sous-tâche:', error);
        this.loading = false;
        // Afficher un message d'erreur
      }
    });
  }

  deleteSubtask(subtaskId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-tâche ?')) {
      this.loading = true;
      this.taskService.deleteSubtask(subtaskId).subscribe({
        next: () => {
          // Supprimer la sous-tâche de la tâche parente
          if (this.selectedTask) {
            this.selectedTask.subtasks = this.selectedTask.subtasks.filter(st => st.id !== subtaskId);
            this.updateTaskProgress(this.selectedTask);
          }
          this.loading = false;
          // Afficher un message de succès
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la sous-tâche:', error);
          this.loading = false;
          // Afficher un message d'erreur
        }
      });
    }
  }

  toggleSubtask(subtask: SubTask) {
    const shouldComplete = !subtask.is_completed;
    const request$ = shouldComplete
      ? this.taskService.markSubtaskCompleted(subtask.id)
      : this.taskService.markSubtaskUncompleted(subtask.id);

    request$.subscribe({
      next: () => {
        subtask.is_completed = shouldComplete;
        if (this.selectedTask) {
          this.updateTaskProgress(this.selectedTask);
        }
      },
      error: (error) => {
        console.error('Erreur lors du changement d\'état de la sous-tâche:', error);
      }
    });
  }

  // Gestion des modales
  openCreateTaskModal() {
    console.log('Opening create task modal');
    this.resetCreateTaskForm();
    this.showCreateTaskModal = true;
    console.log('Modal state:', this.showCreateTaskModal);
    console.log('Projects available:', this.projects.length);
    console.log('Employees available:', this.employees.length);
    
    // Force change detection
    setTimeout(() => {
      console.log('Modal should be visible now:', this.showCreateTaskModal);
    }, 100);
  }

  openEditTaskModal(task: Task) {
    this.selectedTask = task;
    this.editTaskForm = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      start_date: task.start_date,
      end_date: task.end_date,
      assigned_employee_ids: task.assigned_employees.map(e => e.id)
    };
    this.showEditTaskModal = true;
  }

  openCreateSubtaskModal(task: Task) {
    this.selectedTask = task;
    this.createSubtaskForm.task = task.id;
    this.showCreateSubtaskModal = true;
  }

  openEditSubtaskModal(subtask: SubTask) {
    this.editSubtaskForm = {
      section_name: subtask.section_name,
      section_number: subtask.section_number,
      section_id: subtask.section_id,
      kilometrage: subtask.kilometrage,
      assigned_employee_ids: subtask.assigned_employees.map(e => e.id)
    };
    this.editingSubtaskId = subtask.id;
    this.showEditSubtaskModal = true;
  }

  openAssignModal(task: Task) {
    this.selectedTask = task;
    this.editTaskForm.assigned_employee_ids = task.assigned_employees.map(e => e.id);
    this.showAssignModal = true;
  }

  openDeleteModal(task: Task) {
    this.selectedTask = task;
    this.showDeleteModal = true;
  }

  // Gestion du menu contextuel
  openTaskMenu(event: MouseEvent, task: Task) {
    event.preventDefault();
    this.selectedTask = task;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.showContextMenu = true;
  }

  closeContextMenu() {
    this.showContextMenu = false;
    this.selectedTask = null;
  }

  // Navigation
  viewTask(task: Task) {
    // Navigation vers la page de détail de la tâche
    console.log('Voir la tâche:', task);
  }

  // Utilitaires
  resetCreateTaskForm() {
    this.createTaskForm = {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      project: 0,
      start_date: '',
      end_date: '',
      assigned_employee_ids: []
    };
  }

  resetCreateSubtaskForm() {
    this.createSubtaskForm = {
      section_name: '',
      section_number: '',
      section_id: '',
      kilometrage: 0,
      task: 0,
      assigned_employee_ids: []
    };
  }

  updateTaskProgress(task: Task) {
    if (task.subtasks.length === 0) {
      task.progress_percentage = 0;
      return;
    }

    const completedSubtasks = task.subtasks.filter(st => st.is_completed).length;
    task.progress_percentage = Math.round((completedSubtasks / task.subtasks.length) * 100);
  }

  getStatusLabel(status: TaskStatus): string {
    const statusLabels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'À faire',
      [TaskStatus.IN_PROGRESS]: 'En cours',
      [TaskStatus.COMPLETED]: 'Terminé',
      [TaskStatus.BLOCKED]: 'Bloqué'
    };
    return statusLabels[status] || status;
  }

  getPriorityLabel(priority: Priority): string {
    const priorityLabels: Record<Priority, string> = {
      [Priority.VERY_LOW]: 'Très basse',
      [Priority.LOW]: 'Basse',
      [Priority.MEDIUM]: 'Moyenne',
      [Priority.HIGH]: 'Haute',
      [Priority.VERY_HIGH]: 'Très haute'
    };
    return priorityLabels[priority] || priority;
  }

  getPriorityColor(priority: Priority): string {
    const priorityColors: Record<Priority, string> = {
      [Priority.VERY_LOW]: '#6b7280',
      [Priority.LOW]: '#10b981',
      [Priority.MEDIUM]: '#f59e0b',
      [Priority.HIGH]: '#ef4444',
      [Priority.VERY_HIGH]: '#7c2d12'
    };
    return priorityColors[priority] || '#6b7280';
  }

  getProjectTitle(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.title : 'Projet inconnu';
  }

  isTaskOverdue(task: Task): boolean {
    if (task.status === TaskStatus.COMPLETED) return false;
    const endDate = new Date(task.end_date);
    const today = new Date();
    return endDate < today;
  }

  isTaskDueSoon(task: Task): boolean {
    if (task.status === TaskStatus.COMPLETED) return false;
    const endDate = new Date(task.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }

  // Méthode pour basculer l'assignation d'employé
  toggleEmployeeAssignment(employeeId: number, event: any) {
    if (!this.editTaskForm.assigned_employee_ids) {
      this.editTaskForm.assigned_employee_ids = [];
    }

    if (event.target.checked) {
      if (!this.editTaskForm.assigned_employee_ids.includes(employeeId)) {
        this.editTaskForm.assigned_employee_ids.push(employeeId);
      }
    } else {
      this.editTaskForm.assigned_employee_ids = this.editTaskForm.assigned_employee_ids.filter(id => id !== employeeId);
    }
  }

  // Gestion des événements clavier
  @HostListener('document:click')
  onDocumentClick() {
    this.closeContextMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeContextMenu();
    this.showCreateTaskModal = false;
    this.showEditTaskModal = false;
    this.showCreateSubtaskModal = false;
    this.showEditSubtaskModal = false;
    this.showAssignModal = false;
    this.showDeleteModal = false;
  }
}
