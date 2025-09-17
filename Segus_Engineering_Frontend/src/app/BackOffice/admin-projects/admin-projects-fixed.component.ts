import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
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
  // Properties
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  employees: Employee[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus: ProjectStatus | '' = '';
  
  // Filter properties
  startDateFilter = '';
  endDateFilter = '';
  selectedEmployee: number | '' = '';
  viewMode: 'grid' | 'list' = 'grid';
  
  // Sorting properties
  sortField = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Context menu properties
  contextMenuX = 0;
  contextMenuY = 0;
  showContextMenu = false;
  
  // Project statistics
  projectStats = {
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0
  };
  
  // Global references for templates
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
  showDeleteModal = false;
  showAssignModal = false;
  showCreateTaskModal = false;
  showEditTaskModal = false;
  showCreateSubtaskModal = false;
  showEditSubtaskModal = false;
  
  // Form objects
  createProjectForm: CreateProject = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: ProjectStatus.PLANNING,
    budget: 0,
    client_name: '',
    client_email: '',
    client_phone: '',
    priority: Priority.MEDIUM,
    assigned_employee_ids: []
  };
  
  editProjectForm: UpdateProject = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: ProjectStatus.PLANNING,
    budget: 0,
    client_name: '',
    client_email: '',
    client_phone: '',
    priority: Priority.MEDIUM,
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
    title: '',
    description: '',
    due_date: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    task: 0,
    assigned_employee_id: null,
    estimated_hours: 0,
    actual_hours: 0,
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
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadEmployees();
  }

  // Data loading methods
  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        this.projects = response.results || response;
        this.filteredProjects = this.projects;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading = false;
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.results || response;
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
  
  viewProject(project: Project): void {
    this.selectedProject = project;
    this.selectedProjectId = project.id;
    console.log('Viewing project:', project);
  }
  
  openAssignModal(project: Project): void {
    this.selectedProject = project;
    this.showAssignModal = true;
  }
  
  duplicateProject(project: Project): void {
    const duplicatedProject = {
      ...this.createProjectForm,
      title: `${project.title} (Copy)`,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: ProjectStatus.PLANNING
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
    
    const employeeIds = this.assignTaskForm.assigned_employee_ids;
    console.log('Assigning employees:', employeeIds, 'to project:', this.selectedProject.id);
    
    this.showAssignModal = false;
    alert('Employés assignés avec succès!');
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  public applyFilters(): void {
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = !this.searchTerm || 
        project.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || project.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  // Project CRUD methods
  createProject(): void {
    if (!this.createProjectForm.title || !this.createProjectForm.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading = true;
    this.projectService.createProject(this.createProjectForm).subscribe({
      next: (project) => {
        this.projects.push(project);
        this.applyFilters();
        this.showCreateModal = false;
        this.resetCreateForm();
        this.loading = false;
        alert('Projet créé avec succès !');
      },
      error: (error) => {
        console.error('Error creating project:', error);
        this.loading = false;
        alert('Erreur lors de la création du projet');
      }
    });
  }

  editProject(): void {
    if (!this.selectedProject || !this.editProjectForm.title) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading = true;
    this.projectService.updateProject(this.selectedProject.id, this.editProjectForm).subscribe({
      next: (updatedProject) => {
        const index = this.projects.findIndex(p => p.id === this.selectedProject!.id);
        if (index !== -1) {
          this.projects[index] = updatedProject;
        }
        this.applyFilters();
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

  deleteProject(project?: Project): void {
    const projectToDelete = project || this.selectedProject;
    if (!projectToDelete) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete.title}" ?`)) {
      return;
    }

    this.loading = true;
    this.projectService.deleteProject(projectToDelete.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== projectToDelete.id);
        this.applyFilters();
        this.showDeleteModal = false;
        if (!project) this.selectedProject = null;
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

  calculateStats(): void {
    this.projectStats.total = this.projects.length;
    this.projectStats.completed = this.projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    this.projectStats.active = this.projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
    this.projectStats.overdue = this.projects.filter(p => p.status === ProjectStatus.PAUSED).length;
    this.totalItems = this.projects.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  // Context menu methods
  openProjectMenu(event: MouseEvent, project: Project): void {
    event.preventDefault();
    this.selectedProject = project;
    this.showContextMenu = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showContextMenu = false;
  }

  // Task management methods
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
  
  deleteTask(task: Task): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }
    
    if (this.selectedProject?.tasks) {
      const index = this.selectedProject.tasks.findIndex(t => t.id === task.id);
      if (index > -1) {
        this.selectedProject.tasks.splice(index, 1);
        alert('Tâche supprimée avec succès!');
      }
    }
  }
  
  openCreateSubtaskModal(): void {
    this.showCreateSubtaskModal = true;
  }
  
  openEditSubtaskModal(subtask: SubTask): void {
    this.selectedSubtask = subtask;
    this.showEditSubtaskModal = true;
  }

  // Form reset methods
  resetCreateForm(): void {
    this.createProjectForm = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: ProjectStatus.PLANNING,
      budget: 0,
      client_name: '',
      client_email: '',
      client_phone: '',
      priority: Priority.MEDIUM,
      assigned_employee_ids: []
    };
  }

  resetCreateTaskForm(): void {
    this.createTaskForm = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      project: 0,
      assigned_employee_ids: []
    };
  }

  resetCreateSubtaskForm(): void {
    this.createSubtaskForm = {
      title: '',
      description: '',
      due_date: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      task: 0,
      assigned_employee_id: null,
      estimated_hours: 0,
      actual_hours: 0,
      section_number: '',
      section_id: '',
      kilometrage: 0,
      assigned_employee_ids: []
    };
  }

  // Modal management methods
  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetCreateForm();
  }

  openEditModal(project: Project): void {
    this.selectedProject = project;
    this.editProjectForm = {
      title: project.title,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      budget: project.budget,
      client_name: project.client_name,
      client_email: project.client_email,
      client_phone: project.client_phone,
      priority: project.priority,
      assigned_employee_ids: project.assigned_employees?.map(e => e.id) || []
    };
    this.showEditModal = true;
  }

  openDeleteModal(project: Project): void {
    this.selectedProject = project;
    this.showDeleteModal = true;
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showAssignModal = false;
    this.showCreateTaskModal = false;
    this.showEditTaskModal = false;
    this.showCreateSubtaskModal = false;
    this.showEditSubtaskModal = false;
    this.selectedProject = null;
    this.selectedTask = null;
    this.selectedSubtask = null;
  }
}
