import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { ExcelExportService } from '../../services/excel-export.service';
import {
  Project,
  Task,
  SubTask,
  Employee,
  ProjectStatus,
  TaskStatus,
  Priority,
  CreateProject,
  UpdateProject,
  CreateTask,
  UpdateTask,
  CreateSubTask,
  UpdateSubTask
} from '../../models/project.model';

@Component({
  selector: 'app-admin-projects',
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe]
})
export class AdminProjectsComponent implements OnInit {
  employees: Employee[] = [];
  projects: Project[] = [];
  filteredProjects: Project[] = [];

  // Safe getters for template arrays
  get safeEmployees(): Employee[] {
    return Array.isArray(this.employees) ? this.employees : [];
  }

  get safeProjects(): Project[] {
    return Array.isArray(this.projects) ? this.projects : [];
  }

  get safeProjectStatusValues(): ProjectStatus[] {
    try {
      const values = Object.values(ProjectStatus) as ProjectStatus[];
      return Array.isArray(values) ? values : [];
    } catch {
      return [];
    }
  }

  get safeTaskStatusValues(): TaskStatus[] {
    try {
      const values = Object.values(TaskStatus) as TaskStatus[];
      return Array.isArray(values) ? values : [];
    } catch {
      return [];
    }
  }

  get safePriorityValues(): Priority[] {
    try {
      const values = Object.values(Priority) as Priority[];
      return Array.isArray(values) ? values : [];
    } catch {
      return [];
    }
  }

  loading = false;
  searchTerm = '';
  selectedStatus: ProjectStatus | '' = '';
  startDateFilter = '';
  endDateFilter = '';
  selectedEmployee: number | '' = '';
  viewMode: 'grid' | 'list' = 'grid';

  // Getter to ensure filteredProjects is always an array
  get safeFilteredProjects(): Project[] {
    console.log('DEBUG: safeFilteredProjects called, filteredProjects type:', typeof this.filteredProjects);
    console.log('DEBUG: safeFilteredProjects called, filteredProjects value:', this.filteredProjects);
    console.log('DEBUG: safeFilteredProjects called, is array?', Array.isArray(this.filteredProjects));
    
    if (!this.filteredProjects) {
      console.log('DEBUG: filteredProjects is null/undefined, returning empty array');
      return [];
    }
    if (Array.isArray(this.filteredProjects)) {
      console.log('DEBUG: filteredProjects is array with length:', this.filteredProjects.length);
      return this.filteredProjects;
    }
    // If filteredProjects is an object with results property
    if (this.filteredProjects && typeof this.filteredProjects === 'object' && 'results' in this.filteredProjects) {
      console.log('DEBUG: filteredProjects has results property:', (this.filteredProjects as any).results);
      return Array.isArray((this.filteredProjects as any).results) ? (this.filteredProjects as any).results : [];
    }
    // If filteredProjects is an object with data property
    if (this.filteredProjects && typeof this.filteredProjects === 'object' && 'data' in this.filteredProjects) {
      console.log('DEBUG: filteredProjects has data property:', (this.filteredProjects as any).data);
      return Array.isArray((this.filteredProjects as any).data) ? (this.filteredProjects as any).data : [];
    }
    console.error('ERROR: filteredProjects is not an array or expected object format:', this.filteredProjects);
    console.error('ERROR: Type:', typeof this.filteredProjects);
    console.error('ERROR: Constructor:', (this.filteredProjects as any)?.constructor?.name);
    
    // Force reset to empty array to prevent the error
    this.filteredProjects = [];
    return [];
  }

  // Sorting and pagination
  sortField = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Context menu
  contextMenuX = 0;
  contextMenuY = 0;
  showContextMenu = false;

  // Project statistics with all required properties
  projectStats = {
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pausedProjects: 0
  };

  // Global references
  Object = Object;
  Math = Math;
  ProjectStatus = ProjectStatus;
  TaskStatus = TaskStatus;
  Priority = Priority;

  // Selected items
  selectedProject: Project | null = null;
  selectedProjectId: number | null = null;
  selectedTask: Task | null = null;
  selectedSubtask: SubTask | null = null;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showDeleteModal = false;
  showAssignModal = false;
  showCreateTaskModal = false;
  showEditTaskModal = false;
  showCreateSubtaskModal = false;
  showEditSubtaskModal = false;
  showAssignTaskModal = false;

  // Form objects
  createProjectForm: CreateProject = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: ProjectStatus.ACTIVE,
    assigned_employee_ids: []
  };

  editProjectForm: UpdateProject = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: ProjectStatus.ACTIVE,
    assigned_employee_ids: []
  };

  createTaskForm: CreateTask = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    project: 0,
    assigned_employee_ids: []
  };

  editTaskForm: UpdateTask = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
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

  assignTaskForm: { assigned_employee_ids: number[] } = {
    assigned_employee_ids: []
  };

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private excelExportService: ExcelExportService
  ) {
    // Initialize arrays immediately to prevent undefined errors
    this.projects = [];
    this.filteredProjects = [];
  }

  ngOnInit(): void {
    // Initialize arrays first to prevent undefined errors
    this.projects = [];
    this.filteredProjects = [];
    
    this.loadProjects();
    this.loadEmployees();
    this.calculateStats();
  }

  // Data loading methods
  loadProjects(): void {
    this.loading = true;
    // Initialize arrays to prevent undefined errors
    this.projects = [];
    this.filteredProjects = [];
    
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        console.log('API Response received:', response);
        
        let projectsArray: Project[] = [];
        
        // Handle different response formats
        if (Array.isArray(response)) {
          projectsArray = response;
        } else if (response && Array.isArray(response.results)) {
          projectsArray = response.results;
        } else if (response && response.data && Array.isArray(response.data)) {
          projectsArray = response.data;
        } else if (response && typeof response === 'object') {
          console.warn('Unexpected response format, trying to extract array:', response);
          // Try to find any array property in the response
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              projectsArray = response[key];
              break;
            }
          }
        }
        
        // Validate that we have a proper array
        if (!Array.isArray(projectsArray)) {
          console.error('Could not extract projects array from response:', response);
          projectsArray = [];
        }
        
        this.projects = projectsArray;
        this.filteredProjects = [...projectsArray];
        
        console.log('Projects loaded:', this.projects.length);
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.projects = [];
        this.filteredProjects = [];
        this.loading = false;
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.results || response;
        console.log('DEBUG: Loaded employees:', this.employees);
        console.log('DEBUG: Number of employees:', this.employees.length);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  // Search and filter methods
  onSearchChange(): void {
    this.applyFilters();
  }

  // Utility methods
  testApiConnectivity(): void {
    this.projectService.getProjects().subscribe({
      next: (response) => {
        alert('API connection successful!');
        console.log('API Response:', response);
      },
      error: (error) => {
        alert('API connection failed!');
        console.error('API Error:', error);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.selectedEmployee = '';
    this.applyFilters();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.filteredProjects.sort((a, b) => {
      const aValue = (a as any)[this.sortField];
      const bValue = (b as any)[this.sortField];

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  isProjectDueSoon(project: Project): boolean {
    const today = new Date();
    const endDate = new Date(project.end_date);
    const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilDue <= 7 && daysUntilDue > 0 && project.status !== ProjectStatus.COMPLETED;
  }

  isProjectOverdue(project: Project): boolean {
    return project.status !== ProjectStatus.COMPLETED &&
           new Date(project.end_date) < new Date();
  }

  viewProject(project: Project): void {
    this.selectedProject = project;
    this.selectedProjectId = project.id;
    console.log('Viewing project:', project);
    
    // Charger les tâches du projet sélectionné
    if (project.id) {
      this.taskService.getTasksByProject(project.id).subscribe({
        next: (tasks) => {
          console.log('Tasks loaded for project:', tasks);
          if (this.selectedProject) {
            this.selectedProject.tasks = tasks;
          }
        },
        error: (error) => {
          console.error('Error loading project tasks:', error);
          alert('Erreur lors du chargement des tâches du projet');
        }
      });
    }
    
    // Ouvrir le modal de visualisation
    this.showViewModal = true;
    this.showContextMenu = false;
  }

  openAssignModal(project: Project): void {
    this.selectedProject = project;
    // Préparer le formulaire d'édition/assignation avec l'état actuel
    this.editProjectForm = {
      title: project.title,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      assigned_employee_ids: project.assigned_employees?.map(e => e.id) || []
    };
    this.showAssignModal = true;
  }

  openProjectMenu(event: MouseEvent, project: Project): void {
    event.preventDefault();
    this.selectedProject = project;
    this.showContextMenu = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
  }

  duplicateProject(project: Project): void {
    const duplicatedProject = {
      ...this.createProjectForm,
      title: `${project.title} (Copy)`,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: ProjectStatus.ACTIVE
    };

    this.projectService.createProject(duplicatedProject).subscribe({
      next: (newProject) => {
        this.projects.push(newProject);
        this.applyFilters();
        alert('Projet dupliqué avec succès!');
      },
      error: (error) => {
        console.error('Error duplicating project:', error);
        alert('Erreur lors de la duplication du projet');
      }
    });
  }

  assignEmployees(): void {
    if (!this.selectedProject) return;

    const employeeIds = this.editProjectForm.assigned_employee_ids || [];
    console.log('Assigning employees:', employeeIds, 'to project:', this.selectedProject.id);

    this.loading = true;
    this.projectService.assignEmployees(this.selectedProject.id, employeeIds).subscribe({
      next: (updatedProject) => {
        const idx = this.projects.findIndex(p => p.id === this.selectedProject?.id);
        if (idx !== -1) {
          this.projects[idx] = updatedProject as Project;
          this.filteredProjects = [...this.projects];
        }
        // Mettre à jour le projet sélectionné si ouvert
        if (this.selectedProject) {
          this.selectedProject = updatedProject as Project;
        }
        this.calculateStats();
        this.showAssignModal = false;
        this.loading = false;
        alert('Employés assignés avec succès!');
      },
      error: (error) => {
        console.error('Error assigning employees to project:', error);
        this.loading = false;
        alert(error.userMessage || 'Erreur lors de l\'assignation des employés');
      }
    });
  }

  public applyFilters(): void {
    console.log('DEBUG: applyFilters called');
    console.log('DEBUG: this.projects type:', typeof this.projects);
    console.log('DEBUG: this.projects is array:', Array.isArray(this.projects));
    console.log('DEBUG: this.projects value:', this.projects);
    
    try {
      // Ensure projects is an array before filtering
      if (!Array.isArray(this.projects)) {
        console.warn('Projects is not an array in applyFilters:', this.projects);
        this.projects = [];
      }

      this.filteredProjects = this.projects.filter(project => {
        if (!project) return false;

        // Search term filter
        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          const matchesSearch = 
            (project.title && project.title.toLowerCase().includes(searchLower)) ||
            (project.description && project.description.toLowerCase().includes(searchLower)) ||
            ((project as any).client_name && (project as any).client_name.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) return false;
        }

        // Status filter
        if (this.selectedStatus && project.status !== this.selectedStatus) {
          return false;
        }

        // Date filters
        if (this.startDateFilter && project.start_date) {
          if (new Date(project.start_date) < new Date(this.startDateFilter)) {
            return false;
          }
        }

        if (this.endDateFilter && project.end_date) {
          if (new Date(project.end_date) > new Date(this.endDateFilter)) {
            return false;
          }
        }

        // Employee filter
        if (this.selectedEmployee) {
          const hasEmployee = project.assigned_employees && 
            project.assigned_employees.some((emp: any) => emp.id === this.selectedEmployee);
          if (!hasEmployee) return false;
        }

        return true;
      });

      console.log('DEBUG: After filtering, filteredProjects type:', typeof this.filteredProjects);
      console.log('DEBUG: After filtering, filteredProjects is array:', Array.isArray(this.filteredProjects));
      console.log('DEBUG: After filtering, filteredProjects length:', this.filteredProjects?.length);

      // Ensure filteredProjects is always an array
      if (!Array.isArray(this.filteredProjects)) {
        console.error('filteredProjects became non-array after filtering:', this.filteredProjects);
        this.filteredProjects = [];
      }

      // this.updatePagination();
    } catch (error) {
      console.error('Error in applyFilters:', error);
      this.filteredProjects = [];
      // this.updatePagination();
    }
  }

  createProject(): void {
    if (!this.createProjectForm.title || !this.createProjectForm.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Debug: Log des données envoyées
    console.log('FRONTEND DEBUG: Creating project with data:', this.createProjectForm);
    console.log('FRONTEND DEBUG: Assigned employee IDs:', this.createProjectForm.assigned_employee_ids);
    console.log('FRONTEND DEBUG: Type of assigned_employee_ids:', typeof this.createProjectForm.assigned_employee_ids);
    console.log('FRONTEND DEBUG: Is array?', Array.isArray(this.createProjectForm.assigned_employee_ids));
    console.log('FRONTEND DEBUG: Length:', this.createProjectForm.assigned_employee_ids?.length);
    
    // Vérifier que assigned_employee_ids est bien un tableau
    if (!this.createProjectForm.assigned_employee_ids) {
      this.createProjectForm.assigned_employee_ids = [];
      console.log('FRONTEND DEBUG: Initialized empty assigned_employee_ids array');
    }
    
    console.log('FRONTEND DEBUG: Final data being sent:', JSON.stringify(this.createProjectForm, null, 2));

    this.loading = true;
    const payload = this.normalizeProjectPayload(this.createProjectForm);
    this.projectService.createProject(payload).subscribe({
      next: (project) => {
        console.log('FRONTEND DEBUG: Project created successfully:', project);
        console.log('FRONTEND DEBUG: Assigned employees in response:', project.assigned_employees);
        this.projects.push(project);
        this.applyFilters();
        this.calculateStats();
        this.showCreateModal = false;
        this.resetCreateForm();
        this.loading = false;
        alert('Projet créé avec succès !');
      },
      error: (error) => {
        console.error('FRONTEND DEBUG: Error creating project:', error);
        console.error('FRONTEND DEBUG: Error details:', error.error);
        this.loading = false;
        alert('Erreur lors de la création du projet');
      }
    });
  }

  editProject(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    const payload = this.normalizeProjectPayload(this.editProjectForm);
    this.projectService.updateProject(this.selectedProject.id, payload).subscribe({
      next: (updatedProject) => {
        const index = this.projects.findIndex(p => p.id === this.selectedProject!.id);
        if (index !== -1) {
          this.projects[index] = updatedProject;
          this.applyFilters();
          this.calculateStats();
        }
        this.showEditModal = false;
        this.selectedProject = null;
        this.loading = false;
        alert('Projet modifié avec succès !');
      },
      error: (error) => {
        console.error('Error updating project:', error);
        this.loading = false;
        alert('Erreur lors de la modification du projet');
      }
    });
  }

  deleteProject(projectId?: number): void {
    const idToDelete = projectId || this.selectedProject?.id;
    if (!idToDelete) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    this.loading = true;
    this.projectService.deleteProject(idToDelete).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== idToDelete);
        this.applyFilters();
        this.showDeleteModal = false;
        this.selectedProject = null;
        this.loading = false;
        alert('Projet supprimé avec succès !');
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        this.loading = false;
        alert('Erreur lors de la suppression du projet');
      }
    });
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  // Task assignment method
  assignEmployeesToTask(): void {
    if (!this.selectedTask) {
      alert('Aucune tâche sélectionnée pour l\'assignation');
      return;
    }

    this.loading = true;
    const employeeIds = this.assignTaskForm.assigned_employee_ids || [];

    if (employeeIds.length === 0) {
      alert('Veuillez sélectionner au moins un employé');
      this.loading = false;
      return;
    }

    this.taskService.assignEmployeesToTask(this.selectedTask.id, employeeIds).subscribe({
      next: (updatedTask: any) => {
        // Update task in selected project
        if (this.selectedProject && this.selectedProject.tasks) {
          const taskIndex = this.selectedProject.tasks.findIndex(t => t.id === this.selectedTask?.id);
          if (taskIndex !== -1) {
            this.selectedProject.tasks[taskIndex] = { ...this.selectedProject.tasks[taskIndex], ...updatedTask };
          }
        }

        // Update in projects list
        const projectIndex = this.projects.findIndex(p => p.id === this.selectedProject?.id);
        if (projectIndex !== -1 && this.selectedProject) {
          this.projects[projectIndex] = { ...this.selectedProject } as Project;
          this.filteredProjects = [...this.projects];
        }

        this.showAssignTaskModal = false;
        this.resetAssignTaskForm();
        this.loading = false;
        alert('Employés assignés avec succès à la tâche !');
      },
      error: (error) => {
        console.error('Error assigning employees to task:', error);
        this.loading = false;
        alert('Erreur lors de l\'assignation des employés à la tâche');
      }
    });
  }

  // Form reset methods
  resetAssignTaskForm(): void {
    this.assignTaskForm = {
      assigned_employee_ids: []
    };
  }

  resetCreateForm(): void {
    this.createProjectForm = {
      title: '',
      description: '',
      status: ProjectStatus.ACTIVE,
      start_date: '',
      end_date: '',
      assigned_employee_ids: []
    };
    console.log('FRONTEND DEBUG: Form reset, assigned_employee_ids:', this.createProjectForm.assigned_employee_ids);
  }

  resetCreateSubtaskForm(): void {
    this.createSubtaskForm = {
      section_name: '',
      section_number: '',
      section_id: '',
      kilometrage: 0,
      task: 0,
      assigned_employee_ids: []
    };
  }

  // Subtask methods
  createSubtask(): void {
    if (!this.selectedTask) {
      alert('Aucune tâche sélectionnée');
      return;
    }

    if (!this.createSubtaskForm.section_name || !this.createSubtaskForm.section_number) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading = true;
    const subtaskData: CreateSubTask = {
      ...this.createSubtaskForm,
      task: this.selectedTask.id,
      assigned_employee_ids: Array.isArray(this.createSubtaskForm.assigned_employee_ids)
        ? this.createSubtaskForm.assigned_employee_ids
        : []
    };

    // Simulate subtask creation
    try {
      const newSubtask: SubTask = {
        id: Date.now(),
        section_name: subtaskData.section_name,
        section_number: subtaskData.section_number,
        section_id: subtaskData.section_id,
        kilometrage: subtaskData.kilometrage || 0,
        is_completed: false,
        completed_at: null,
        task: subtaskData.task,
        assigned_employees: this.employees.filter(e => subtaskData.assigned_employee_ids?.includes(e.id)),
        created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (this.selectedTask.subtasks) {
        this.selectedTask.subtasks.push(newSubtask);
      } else {
        this.selectedTask.subtasks = [newSubtask];
      }

      this.showCreateSubtaskModal = false;
      this.resetCreateSubtaskForm();
      this.loading = false;
      alert('Sous-tâche créée avec succès !');
    } catch (error) {
      console.error('Error creating subtask:', error);
      this.loading = false;
      alert('Erreur lors de la création de la sous-tâche');
    }
  }

  editSubtask(): void {
    if (!this.selectedSubtask) return;

    this.loading = true;
    const subtaskData: UpdateSubTask = {
      ...this.editSubtaskForm,
      assigned_employee_ids: Array.isArray(this.editSubtaskForm.assigned_employee_ids)
        ? this.editSubtaskForm.assigned_employee_ids
        : []
    };

    // Simulate subtask update
    setTimeout(() => {
      if (this.selectedSubtask) {
        Object.assign(this.selectedSubtask, subtaskData);
        this.selectedSubtask.assigned_employees = this.employees.filter(e =>
          subtaskData.assigned_employee_ids?.includes(e.id)
        );
        this.selectedSubtask.updated_at = new Date().toISOString();
      }

      this.showEditSubtaskModal = false;
      this.selectedSubtask = null;
      this.loading = false;
      alert('Sous-tâche modifiée avec succès !');
    }, 1000);
  }

  deleteSubtask(subtaskId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-tâche ?')) {
      if (this.selectedTask && this.selectedTask.subtasks) {
        this.selectedTask.subtasks = this.selectedTask.subtasks.filter(s => s.id !== subtaskId);
        alert('Sous-tâche supprimée avec succès !');
      }
    }
  }

  // Utility methods
  getStatusLabel(status: ProjectStatus): string {
    const statusLabels: Record<ProjectStatus, string> = {
      [ProjectStatus.ACTIVE]: 'Actif',
      [ProjectStatus.COMPLETED]: 'Terminé',
      [ProjectStatus.PAUSED]: 'En pause',
      [ProjectStatus.CANCELLED]: 'Annulé'
    };
    return statusLabels[status] || status;
  }

  getStatusColor(status: ProjectStatus): string {
    const statusColors: Record<ProjectStatus, string> = {
      [ProjectStatus.ACTIVE]: '#28a745',
      [ProjectStatus.COMPLETED]: '#007bff',
      [ProjectStatus.PAUSED]: '#ffc107',
      [ProjectStatus.CANCELLED]: '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  }

  getTaskStatusLabel(status: TaskStatus): string {
    const statusLabels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'À faire',
      [TaskStatus.IN_PROGRESS]: 'En cours',
      [TaskStatus.COMPLETED]: 'Terminée',
      [TaskStatus.BLOCKED]: 'Bloquée'
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
      [Priority.VERY_LOW]: '#28a745',
      [Priority.LOW]: '#6f42c1',
      [Priority.MEDIUM]: '#ffc107',
      [Priority.HIGH]: '#fd7e14',
      [Priority.VERY_HIGH]: '#dc3545'
    };
    return priorityColors[priority] || '#6c757d';
  }

  getTaskStatusColor(status: TaskStatus): string {
    const statusColors: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: '#6c757d',
      [TaskStatus.IN_PROGRESS]: '#007bff',
      [TaskStatus.COMPLETED]: '#28a745',
      [TaskStatus.BLOCKED]: '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  }

  // Employee toggle methods
  toggleEmployee(employeeId: number, formType: 'create' | 'edit' | 'assign'): void {
    console.log('FRONTEND DEBUG: toggleEmployee called with:', employeeId, formType);
    
    // Trouver l'employé pour afficher ses détails
    const employee = this.employees.find(e => e.id === employeeId);
    console.log('FRONTEND DEBUG: Employee details:', employee);
    
    if (formType === 'create') {
      if (!this.createProjectForm.assigned_employee_ids) {
        this.createProjectForm.assigned_employee_ids = [];
      }
      const index = this.createProjectForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.createProjectForm.assigned_employee_ids.splice(index, 1);
        console.log('FRONTEND DEBUG: Removed employee', employeeId, 'from create form');
      } else {
        this.createProjectForm.assigned_employee_ids.push(employeeId);
        console.log('FRONTEND DEBUG: Added employee', employeeId, 'to create form');
      }
      console.log('FRONTEND DEBUG: Current assigned_employee_ids:', this.createProjectForm.assigned_employee_ids);
      console.log('FRONTEND DEBUG: Selected employees details:', this.createProjectForm.assigned_employee_ids.map(id => {
        const emp = this.employees.find(e => e.id === id);
        return emp ? `${emp.id}: ${emp.username} (${emp.email})` : `${id}: NOT FOUND`;
      }));
    } else {
      if (!this.editProjectForm.assigned_employee_ids) {
        this.editProjectForm.assigned_employee_ids = [];
      }
      const index = this.editProjectForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.editProjectForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.editProjectForm.assigned_employee_ids.push(employeeId);
      }
    }
  }

  toggleTaskEmployee(employeeId: number, formType: 'create' | 'edit'): void {
    if (formType === 'create') {
      if (!this.createTaskForm.assigned_employee_ids) {
        this.createTaskForm.assigned_employee_ids = [];
      }
      const index = this.createTaskForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.createTaskForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.createTaskForm.assigned_employee_ids.push(employeeId);
      }
    } else {
      if (!this.editTaskForm.assigned_employee_ids) {
        this.editTaskForm.assigned_employee_ids = [];
      }
      const index = this.editTaskForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.editTaskForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.editTaskForm.assigned_employee_ids.push(employeeId);
      }
    }
  }

  toggleSubtaskEmployee(employeeId: number, formType: 'create' | 'edit'): void {
    if (formType === 'create') {
      if (!this.createSubtaskForm.assigned_employee_ids) {
        this.createSubtaskForm.assigned_employee_ids = [];
      }
      const index = this.createSubtaskForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.createSubtaskForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.createSubtaskForm.assigned_employee_ids.push(employeeId);
      }
    } else {
      if (!this.editSubtaskForm.assigned_employee_ids) {
        this.editSubtaskForm.assigned_employee_ids = [];
      }
      const index = this.editSubtaskForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.editSubtaskForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.editSubtaskForm.assigned_employee_ids.push(employeeId);
      }
    }
  }

  // Tracking methods for ngFor
  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  trackBySubtaskId(index: number, subtask: SubTask): number {
    return subtask.id;
  }

  // Modal management
  openCreateModal(): void {
    this.resetCreateForm();
    this.showCreateModal = true;
    console.log('FRONTEND DEBUG: Modal opened, form state:', this.createProjectForm);
  }

  openEditModal(project: Project): void {
    this.selectedProject = project;
    this.selectedProjectId = project.id;
    this.editProjectForm = {
      title: project.title,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      assigned_employee_ids: project.assigned_employees?.map(e => e.id) || []
    };
    this.showEditModal = true;
  }

  openDeleteModal(project: Project): void {
    this.selectedProject = project;
    this.showDeleteModal = true;
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.showCreateTaskModal = false;
    this.showEditTaskModal = false;
    this.showAssignTaskModal = false;
    this.showCreateSubtaskModal = false;
    this.showEditSubtaskModal = false;
  }

  // Event listeners
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    this.closeAllModals();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.showContextMenu = false;
  }

  // Notification method
  private sendAssignmentNotifications(projectId: number, employeeIds: number[], projectTitle: string): void {
    this.notificationService.notifyProjectAssignment(projectId, employeeIds, projectTitle).subscribe({
      next: (response) => {
        console.log('Notifications sent:', response);
      },
      error: (error) => {
        console.error('Error sending notifications:', error);
      }
    });
  }



  // Missing methods referenced in template


  calculateStats(): void {
    const total = this.projects.length;
    const completed = this.projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const active = this.projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
    const paused = this.projects.filter(p => p.status === ProjectStatus.PAUSED).length;

    // Remplir les deux schémas de propriétés utilisés dans le template/état
    this.projectStats.total = total;
    this.projectStats.completed = completed;
    this.projectStats.active = active;
    this.projectStats.overdue = paused; // conservé pour compatibilité interne

    this.projectStats.totalProjects = total;
    this.projectStats.completedProjects = completed;
    this.projectStats.activeProjects = active;
    this.projectStats.pausedProjects = paused;

    this.totalItems = total;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  // Normalisation des payloads: dates en YYYY-MM-DD, suppression des champs vides pour PATCH, arrays sûres
  private normalizeProjectPayload(payload: any): any {
    const normalized: any = { ...payload };

    const toYMD = (val: any): string | null => {
      if (val === undefined || val === null || val === '') return null;
      const s = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return null;
    };

    if ('start_date' in normalized) normalized.start_date = toYMD(normalized.start_date);
    if ('end_date' in normalized) normalized.end_date = toYMD(normalized.end_date);

    ['title', 'description', 'status'].forEach((k) => {
      if (k in normalized && (normalized[k] === '' || normalized[k] === undefined)) {
        // Supprimer les champs vides au lieu d'envoyer null (évite 400 sur PATCH)
        delete normalized[k];
      }
    });

    // Nettoyer dates nulles (supprimer au lieu d'envoyer null)
    ['start_date', 'end_date'].forEach((k) => {
      if (k in normalized && normalized[k] === null) {
        delete normalized[k];
      }
    });

    // assigned_employee_ids: conserver array si fourni, sinon ne pas envoyer la clé
    if ('assigned_employee_ids' in normalized) {
      if (!Array.isArray(normalized.assigned_employee_ids)) {
        normalized.assigned_employee_ids = normalized.assigned_employee_ids ? [normalized.assigned_employee_ids] : [];
      }
    }

    return normalized;
  }

  // Task-related properties and methods
  get selectedProjectTasks(): Task[] {
    return this.selectedProject?.tasks || [];
  }

  get hasSelectedProjectTasks(): boolean {
    return this.selectedProjectTasks.length > 0;
  }

  openCreateTaskModal(): void {
    this.showCreateTaskModal = true;
    this.resetCreateTaskForm();
  }

  resetCreateTaskForm(): void {
    this.createTaskForm = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      project: this.selectedProject?.id || 0,
      assigned_employee_ids: []
    };
  }

  openEditTaskModal(task: Task): void {
    this.selectedTask = task;
    this.editTaskForm = {
      title: task.title,
      description: task.description,
      start_date: task.start_date,
      end_date: task.end_date,
      status: task.status,
      priority: task.priority,
      assigned_employee_ids: task.assigned_employees?.map(e => e.id) || []
    };
    this.showEditTaskModal = true;
  }

  openCreateSubtaskModal(task?: Task): void {
    if (task) {
      this.selectedTask = task;
    }
    this.showCreateSubtaskModal = true;
  }

  openEditSubtaskModal(subtask: SubTask): void {
    this.selectedSubtask = subtask;
    this.showEditSubtaskModal = true;
  }

  createTask(): void {
    if (!this.selectedProject || !this.createTaskForm.title) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const taskData = {
      ...this.createTaskForm,
      project: this.selectedProject.id
    };

    const newTask: Task = {
      id: Date.now(),
      title: taskData.title,
      description: taskData.description,
      start_date: taskData.start_date,
      end_date: taskData.end_date,
      status: taskData.status || TaskStatus.TODO,
      priority: taskData.priority || Priority.MEDIUM,
      project: taskData.project,
      assigned_employees: this.employees.filter(e => taskData.assigned_employee_ids?.includes(e.id)),
      subtasks: [],
      progress_percentage: 0,
      total_subtasks: 0,
      completed_subtasks: 0,
      created_by: { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.selectedProject.tasks) {
      this.selectedProject.tasks.push(newTask);
    } else {
      this.selectedProject.tasks = [newTask];
    }

    this.showCreateTaskModal = false;
    this.resetCreateTaskForm();
    alert('Tâche créée avec succès!');
  }

  editTask(): void {
    if (!this.selectedTask || !this.editTaskForm.title) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    Object.assign(this.selectedTask, this.editTaskForm);
    this.selectedTask.assigned_employees = this.employees.filter(e =>
      this.editTaskForm.assigned_employee_ids?.includes(e.id)
    );

    this.showEditTaskModal = false;
    alert('Tâche modifiée avec succès!');
  }

  deleteTask(taskOrId: Task | number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    const taskId = typeof taskOrId === 'number' ? taskOrId : taskOrId.id;
    
    if (this.selectedProject?.tasks) {
      const index = this.selectedProject.tasks.findIndex(t => t.id === taskId);
      if (index > -1) {
        this.selectedProject.tasks.splice(index, 1);
        alert('Tâche supprimée avec succès!');
      }
    }
  }

  // Excel Export Methods
  exportToExcel(): void {
    this.excelExportService.exportProjectsToExcel(this.projects, this.employees);
  }

  exportDetailedReport(): void {
    this.excelExportService.exportDetailedProjectReport(this.projects, this.employees);
  }

  exportProjectSummary(): void {
    this.excelExportService.exportProjectSummary(this.projects);
  }
}
