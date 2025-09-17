import { Component, OnInit, HostListener } from '@angular/core';
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
  styleUrls: ['./admin-projects.component.css']
})
export class AdminProjectsComponent implements OnInit {
  // Properties
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  employees: Employee[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus: ProjectStatus | '' = '';
  
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
  showAssignTaskModal = false;
  showCreateSubtaskModal = false;
  showEditSubtaskModal = false;
  
  // Context menu
  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  
  // Forms
  createProjectForm: CreateProject = {
    title: '',
    description: '',
    status: ProjectStatus.ACTIVE,
    start_date: '',
    end_date: '',
    assigned_employee_ids: []
  };
  
  editProjectForm: UpdateProject = {
    title: '',
    description: '',
    status: ProjectStatus.ACTIVE,
    start_date: '',
    end_date: '',
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
  
  // Enums for template
  ProjectStatus = ProjectStatus;
  TaskStatus = TaskStatus;
  Priority = Priority;

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
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
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
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  // Search and filter methods
  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
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
    if (!this.selectedProject) return;

    this.loading = true;
    this.projectService.updateProject(this.selectedProject.id, this.editProjectForm).subscribe({
      next: (updatedProject) => {
        const index = this.projects.findIndex(p => p.id === this.selectedProject!.id);
        if (index !== -1) {
          this.projects[index] = updatedProject;
          this.applyFilters();
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

  deleteProject(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    this.projectService.deleteProject(this.selectedProject.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== this.selectedProject!.id);
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
    if (formType === 'create') {
      if (!this.createProjectForm.assigned_employee_ids) {
        this.createProjectForm.assigned_employee_ids = [];
      }
      const index = this.createProjectForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.createProjectForm.assigned_employee_ids.splice(index, 1);
      } else {
        this.createProjectForm.assigned_employee_ids.push(employeeId);
      }
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

  isProjectOverdue(project: Project): boolean {
    return project.status !== ProjectStatus.COMPLETED && 
           new Date(project.end_date) < new Date();
  }
}
