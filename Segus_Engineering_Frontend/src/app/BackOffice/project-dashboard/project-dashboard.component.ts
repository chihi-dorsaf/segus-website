import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, tap } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import {
  Project,
  Task,
  SubTask,
  TaskStatus,
  Priority,
  ProjectStatus,
  TaskWithDetails,
  ProjectWithDetails,
  CreateTask,
  UpdateTask,
  CreateSubTask,
  UpdateSubTask,
  CreateProject,
  UpdateProject,
  TASK_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  PRIORITY_LABELS,
  UserSimple,
  PaginatedResponse
} from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

interface ProjectFilter {
  status?: ProjectStatus;
  search: string;
}

@Component({
  selector: 'app-project-dashboard',
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class ProjectDashboardComponent implements OnInit, OnDestroy {
  projects: ProjectWithDetails[] = [];
  tasks: TaskWithDetails[] = [];
  subtasks: SubTask[] = [];
  selectedProject: ProjectWithDetails | null = null;
  employees: UserSimple[] = [];
  isLoading = false;
  error: string | null = null;
  expandedTaskId: number | null = null;

  // États des modals et formulaires
  isCreatingProject = false;
  isEditingProject = false;
  isSubmittingProject = false;
  isCreatingTask = false;
  isCreatingTaskInProgress = false;
  isCreatingSubtask: { [key: number]: boolean } = {};
  isCreatingSubtaskInProgress = false;
  isAssigningEmployees = false;
  isAssigningEmployeesInProgress = false;

  // État de confirmation
  showConfirmModal = false;
  confirmModalMessage = '';
  pendingConfirmAction: (() => void) | null = null;

  // Données des formulaires
  currentProjectData: any = {};
  editingProjectId: number | null = null;
  editingProject: ProjectWithDetails | null = null;
  selectedEmployeeIds: number[] = [];
  assigningToProject: ProjectWithDetails | null = null;

  newTask: CreateTask = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    project: 0,
    assigned_employee_ids: []
  };

  newSubtask: CreateSubTask = {
    section_name: '',
    section_number: '',
    section_id: '',
    kilometrage: 0,
    task: 0,
    assigned_employee_ids: []
  };

  projectFilters: ProjectFilter = {
    status: undefined,
    search: ''
  };

  toasts: Toast[] = [];

  // Constants pour le template
  readonly TaskStatus = TaskStatus;
  readonly Priority = Priority;
  readonly ProjectStatus = ProjectStatus;
  readonly TASK_STATUS_LABELS = TASK_STATUS_LABELS;
  readonly PROJECT_STATUS_LABELS = PROJECT_STATUS_LABELS;
  readonly PRIORITY_LABELS = PRIORITY_LABELS;
  readonly Object = Object;

  private destroy$ = new Subject<void>();
  currentUser: any = null;
  private apiUrl: string = environment.apiUrl;

  // Computed properties
  get activeProjects(): number {
    return this.projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {
    this.initializeDefaultValues();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDefaultValues(): void {
    this.currentProjectData = { title: '', description: '', start_date: '', end_date: '', status: ProjectStatus.ACTIVE };
    this.newTask = { title: '', description: '', start_date: '', end_date: '', status: TaskStatus.TODO, priority: Priority.MEDIUM, project: 0, assigned_employee_ids: [] };
    this.newSubtask = { section_name: '', section_number: '', section_id: '', kilometrage: 0, task: 0, assigned_employee_ids: [] };
  }

  private initializeComponent(): void {
    console.log('=== INITIALIZING PROJECT DASHBOARD ===');
    this.isLoading = true;
    this.error = null;

    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);

    if (!this.currentUser) {
      console.error('No current user found');
      this.error = 'Utilisateur non connecté';
      this.isLoading = false;
      this.showToast('Veuillez vous reconnecter', 'error');
      this.router.navigate(['/login']);
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      this.error = 'Token d\'authentification manquant';
      this.isLoading = false;
      this.showToast('Session expirée, veuillez vous reconnecter', 'error');
      this.router.navigate(['/login']);
      return;
    }

    console.log('Authentication OK, loading data...');

    forkJoin({
      projects: this.loadProjectsData(),
      employees: this.loadEmployeesData()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        console.log('=== INITIAL DATA LOADED ===');
        console.log('Projects data:', data.projects);
        console.log('Employees data:', data.employees);

        this.projects = data.projects.results || [];
        console.log('Projects loaded:', this.projects.length);

        this.employees = data.employees || [];
        console.log('Employees loaded:', this.employees.length);

        this.isLoading = false;

        if (this.projects.length > 0 && !this.selectedProject) {
          console.log('Selecting first project:', this.projects[0]);
          this.selectProject(this.projects[0]);
        } else if (this.projects.length === 0) {
          this.showToast('Aucun projet trouvé. Créez votre premier projet.', 'info');
        }

        console.log('=== INITIALIZATION COMPLETE ===');
      },
      error: (error) => {
        console.error('=== ERROR LOADING INITIAL DATA ===');
        console.error('Error details:', error);
        this.isLoading = false;
        this.error = error.userMessage || 'Erreur lors du chargement des données';
        this.showToast(this.error ?? 'Erreur lors du chargement des données', 'error');

        if (error.status === 401) {
          console.log('Authentication error, logging out...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // ========== MÉTHODES POUR LES PROJETS ==========

  openCreateProjectModal(): void {
    this.isCreatingProject = true;
    this.isEditingProject = false;
    this.editingProjectId = null;
    this.editingProject = null;
    this.currentProjectData = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: ProjectStatus.ACTIVE,
      assigned_employee_ids: []
    };
  }

  openEditProjectModal(project: ProjectWithDetails): void {
    console.log('Opening edit modal for project:', project);

    // Sauvegarder dans sessionStorage comme backup
    sessionStorage.setItem('editingProject', JSON.stringify({
      id: project.id,
      title: project.title,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      assigned_employees: project.assigned_employees
    }));

    this.isEditingProject = true;
    this.isCreatingProject = false;
    this.editingProjectId = project.id;
    this.editingProject = { ...project }; // Créer une copie
    this.currentProjectData = {
      title: project.title,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      assigned_employee_ids: project.assigned_employees?.map(emp => emp.id) || []
    };

    console.log('Editing project ID set to:', this.editingProjectId);
    console.log('Current project data:', this.currentProjectData);
  }

  closeProjectModal(): void {
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('editingProject');

    // Ne pas réinitialiser immédiatement si on est en train de soumettre
    if (!this.isSubmittingProject) {
      this.isCreatingProject = false;
      this.isEditingProject = false;
      this.editingProjectId = null;
      this.editingProject = null;
      this.currentProjectData = {};
    }
  }

  submitProjectForm(): void {
    console.log('submitProjectForm called');
    console.log('isSubmittingProject:', this.isSubmittingProject);
    console.log('isCreatingProject:', this.isCreatingProject);
    console.log('isEditingProject:', this.isEditingProject);
    console.log('editingProjectId:', this.editingProjectId);

    if (this.isSubmittingProject) {
      console.log('Already submitting, returning');
      return;
    }

    if (!this.currentProjectData.title?.trim()) {
      this.showToast('Le titre du projet est requis', 'error');
      return;
    }

    if (!this.currentProjectData.description?.trim()) {
      this.showToast('La description du projet est requise', 'error');
      return;
    }

    this.isSubmittingProject = true;

    if (this.isCreatingProject) {
      console.log('Calling createProject');
      this.createProject();
    } else if (this.isEditingProject) {
      console.log('Calling updateProject');
      this.updateProject();
    } else {
      console.error('Invalid state for form submission');
      this.showToast('État invalide du formulaire', 'error');
      this.isSubmittingProject = false;
    }
  }

  createProject(): void {
    const projectData: CreateProject = {
      title: this.currentProjectData.title.trim(),
      description: this.currentProjectData.description.trim(),
      start_date: this.currentProjectData.start_date,
      end_date: this.currentProjectData.end_date,
      status: this.currentProjectData.status,
      assigned_employee_ids: this.currentProjectData.assigned_employee_ids || []
    };

    this.projectService.createProject(projectData).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error creating project:', error);
        this.showToast(error.userMessage || 'Erreur lors de la création du projet', 'error');
        this.isSubmittingProject = false;
        return of(null);
      })
    ).subscribe(project => {
      if (project) {
        this.showToast('Projet créé avec succès', 'success');
        this.closeProjectModal();
        this.loadProjects();
      }
      this.isSubmittingProject = false;
    });
  }

  updateProject(): void {
    console.log('updateProject called');
    console.log('editingProjectId:', this.editingProjectId);
    console.log('editingProject:', this.editingProject);

    let projectId = this.editingProjectId;
    let projectObject = this.editingProject;

    // Si pas d'ID, essayer de récupérer depuis sessionStorage
    if (!projectId || !projectObject) {
      console.log('Trying to recover project from sessionStorage...');
      const storedProjectData = sessionStorage.getItem('editingProject');
      if (storedProjectData) {
        try {
          const storedProject = JSON.parse(storedProjectData);
          projectId = storedProject.id;
          projectObject = storedProject;
          console.log('Recovered project ID from sessionStorage:', projectId);
        } catch (e) {
          console.error('Error parsing stored project data:', e);
        }
      }
    }

    if (!projectId) {
      console.error('No project ID found for update');
      this.showToast('Aucun projet sélectionné pour modification', 'error');
      this.isSubmittingProject = false;
      return;
    }

    // Validation supplémentaire : vérifier que le projet existe toujours
    const projectToUpdate = this.projects.find(p => p.id === projectId);
    if (!projectToUpdate) {
      console.error('Project not found in projects list:', projectId);
      this.showToast('Le projet à modifier n\'existe plus', 'error');
      this.closeProjectModal();
      this.isSubmittingProject = false;
      return;
    }

    const updateData: UpdateProject = {
      title: this.currentProjectData.title.trim(),
      description: this.currentProjectData.description.trim(),
      start_date: this.currentProjectData.start_date,
      end_date: this.currentProjectData.end_date,
      status: this.currentProjectData.status
    };

    console.log('Updating project with data:', updateData);

    this.projectService.updateProject(projectId, updateData).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error updating project:', error);
        this.showToast(error.userMessage || 'Erreur lors de la mise à jour du projet', 'error');
        this.isSubmittingProject = false;
        return of(null);
      })
    ).subscribe(updatedProject => {
      if (updatedProject) {
        this.showToast('Projet mis à jour avec succès', 'success');

        // Mettre à jour la liste des projets
        const projectIndex = this.projects.findIndex(p => p.id === updatedProject.id);
        if (projectIndex !== -1) {
          this.projects[projectIndex] = updatedProject;
        }

        // Mettre à jour le projet sélectionné si c'est le même
        if (this.selectedProject && this.selectedProject.id === updatedProject.id) {
          this.selectedProject = updatedProject;
        }

        this.closeProjectModal();
      }
      this.isSubmittingProject = false;
    });
  }

  confirmDeleteProject(projectId: number): void {
    this.confirmModalMessage = 'Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.';
    this.pendingConfirmAction = () => this.deleteProject(projectId);
    this.showConfirmModal = true;
  }

  deleteProject(projectId: number): void {
    this.projectService.deleteProject(projectId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error deleting project:', error);
        this.showToast(error.userMessage || 'Erreur lors de la suppression du projet', 'error');
        return of(null);
      })
    ).subscribe(result => {
      if (result !== null) {
        this.showToast('Projet supprimé avec succès', 'success');
        this.projects = this.projects.filter(project => project.id !== projectId);

        // Si le projet supprimé était sélectionné, le désélectionner
        if (this.selectedProject?.id === projectId) {
          this.selectedProject = null;
        }

        this.loadProjects();
      }
    });
  }

  // ========== MÉTHODES POUR L'ASSIGNATION D'EMPLOYÉS ==========

  openAssignEmployeesModal(project: ProjectWithDetails): void {
    this.assigningToProject = project;
    this.isAssigningEmployees = true;
    this.selectedEmployeeIds = project.assigned_employees?.map(emp => emp.id).filter((id): id is number => id !== undefined) || [];
    console.log('Current assigned employees:', this.selectedEmployeeIds);

    // S'assurer que les employés sont chargés
    if (this.employees.length === 0) {
      this.loadEmployeesData().subscribe({
        next: (employees) => {
          this.employees = employees || [];
          if (this.employees.length === 0) {
            this.showToast('Aucun employé disponible pour assignation.', 'warning');
          }
        },
        error: (error) => {
          console.error('Failed to reload employees:', error);
          this.showToast('Erreur lors du chargement des employés', 'error');
        }
      });
    }
  }

  closeAssignEmployeesModal(): void {
    this.isAssigningEmployees = false;
    this.isAssigningEmployeesInProgress = false;
    this.assigningToProject = null;
    this.selectedEmployeeIds = [];
  }

  toggleEmployeeSelection(employeeId: number): void {
    const index = this.selectedEmployeeIds.indexOf(employeeId);
    if (index === -1) {
      this.selectedEmployeeIds.push(employeeId);
    } else {
      this.selectedEmployeeIds.splice(index, 1);
    }
    console.log('Updated selected employees:', this.selectedEmployeeIds);
  }

  submitAssignEmployees(): void {
    if (!this.assigningToProject) {
      this.showToast('Aucun projet sélectionné pour l\'assignation', 'error');
      return;
    }

    this.isAssigningEmployeesInProgress = true;

    this.projectService.assignEmployees(this.assigningToProject.id, this.selectedEmployeeIds).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error assigning employees:', error);
        this.showToast(error.userMessage || 'Erreur lors de l\'assignation des employés', 'error');
        this.isAssigningEmployeesInProgress = false;
        return of(null);
      })
    ).subscribe(updatedProject => {
      if (updatedProject) {
        const assignedCount = this.selectedEmployeeIds.length;
        this.showToast(`${assignedCount} employé(s) assigné(s) avec succès`, 'success');

        // Mettre à jour la liste des projets
        const projectIndex = this.projects.findIndex(p => p.id === updatedProject.id);
        if (projectIndex !== -1) {
          this.projects[projectIndex] = updatedProject;
        }

        // Mettre à jour le projet sélectionné si c'est le même
        if (this.selectedProject && this.selectedProject.id === updatedProject.id) {
          this.selectedProject = updatedProject;
        }

        this.closeAssignEmployeesModal();
      }
      this.isAssigningEmployeesInProgress = false;
    });
  }

  // ========== MÉTHODES POUR LES TÂCHES ==========

  openCreateTaskModal(): void {
    if (!this.selectedProject?.id) {
      this.showToast('Aucun projet sélectionné', 'error');
      return;
    }

    this.isCreatingTask = true;
    this.newTask = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      project: this.selectedProject.id,
      assigned_employee_ids: []
    };
  }

  cancelCreateTask(): void {
    this.isCreatingTask = false;
    this.isCreatingTaskInProgress = false;
    this.newTask = {
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

  submitCreateTask(): void {
    if (this.isCreatingTaskInProgress) return;

    if (!this.newTask.title?.trim()) {
      this.showToast('Le titre de la tâche est requis', 'error');
      return;
    }

    if (!this.selectedProject?.id) {
      this.showToast('Aucun projet sélectionné', 'error');
      return;
    }

    this.isCreatingTaskInProgress = true;
    this.newTask.project = this.selectedProject.id;

    this.taskService.createTask(this.newTask).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error creating task:', error);
        this.showToast(error.userMessage || 'Erreur lors de la création de la tâche', 'error');
        this.isCreatingTaskInProgress = false;
        return of(null);
      })
    ).subscribe(task => {
      if (task) {
        this.showToast('Tâche créée avec succès', 'success');
        this.cancelCreateTask();
        this.loadTasks();
      }
      this.isCreatingTaskInProgress = false;
    });
  }

  openEditTaskModal(task: TaskWithDetails): void {
    console.log('Edit task:', task);
    this.showToast('Fonctionnalité d\'édition de tâche à implémenter', 'info');
  }

  confirmDeleteTask(taskId: number): void {
    this.confirmModalMessage = 'Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.';
    this.pendingConfirmAction = () => this.deleteTask(taskId);
    this.showConfirmModal = true;
  }

  deleteTask(taskId: number): void {
    this.taskService.deleteTask(taskId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error deleting task:', error);
        this.showToast(error.userMessage || 'Erreur lors de la suppression de la tâche', 'error');
        return of(null);
      })
    ).subscribe(result => {
      if (result !== null) {
        this.showToast('Tâche supprimée avec succès', 'success');
        this.loadTasks();
      }
    });
  }

  // ========== MÉTHODES POUR LES SOUS-TÂCHES ==========

  openCreateSubtaskModal(taskId: number): void {
    this.isCreatingSubtask[taskId] = true;
    this.newSubtask = {
      section_name: '',
      section_number: '',
      section_id: '',
      kilometrage: 0,
      task: taskId,
      assigned_employee_ids: []
    };
  }

  cancelCreateSubtask(taskId: number): void {
    this.isCreatingSubtask[taskId] = false;
    this.isCreatingSubtaskInProgress = false;
  }

  submitCreateSubtask(taskId: number): void {
    if (this.isCreatingSubtaskInProgress) return;

    if (!this.newSubtask.section_name?.trim()) {
      this.showToast('Le nom de la section est requis', 'error');
      return;
    }

    if (!this.newSubtask.section_number?.trim()) {
      this.showToast('Le numéro de section est requis', 'error');
      return;
    }

    if (!this.newSubtask.section_id?.trim()) {
      this.showToast('L\'identifiant de section est requis', 'error');
      return;
    }

    if (this.newSubtask.kilometrage <= 0) {
      this.showToast('Le kilométrage doit être supérieur à 0', 'error');
      return;
    }

    this.isCreatingSubtaskInProgress = true;

    const subtaskData: CreateSubTask = {
      section_name: this.newSubtask.section_name.trim(),
      section_number: this.newSubtask.section_number.trim(),
      section_id: this.newSubtask.section_id.trim(),
      kilometrage: this.newSubtask.kilometrage,
      task: taskId,
      assigned_employee_ids: this.newSubtask.assigned_employee_ids || []
    };

    this.taskService.createSubtask(subtaskData).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error creating subtask:', error);
        this.showToast(error.userMessage || 'Erreur lors de la création de la sous-tâche', 'error');
        this.isCreatingSubtaskInProgress = false;
        return of(null);
      })
    ).subscribe(subtask => {
      if (subtask) {
        this.showToast('Sous-tâche créée avec succès', 'success');
        this.cancelCreateSubtask(taskId);
        this.loadTasks();
      }
      this.isCreatingSubtaskInProgress = false;
    });
  }

  openEditSubtaskModal(subtask: SubTask): void {
    console.log('Edit subtask:', subtask);
    this.showToast('Fonctionnalité d\'édition de sous-tâche à implémenter', 'info');
  }

  confirmDeleteSubtask(subtaskId: number): void {
    this.confirmModalMessage = 'Êtes-vous sûr de vouloir supprimer cette sous-tâche ?';
    this.pendingConfirmAction = () => this.deleteSubtask(subtaskId);
    this.showConfirmModal = true;
  }

  deleteSubtask(subtaskId: number): void {
    this.taskService.deleteSubtask(subtaskId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error deleting subtask:', error);
        this.showToast(error.userMessage || 'Erreur lors de la suppression de la sous-tâche', 'error');
        return of(null);
      })
    ).subscribe(result => {
      if (result !== null) {
        this.showToast('Sous-tâche supprimée avec succès', 'success');
        this.loadTasks();
      }
    });
  }

  // ========== MÉTHODES DE CHARGEMENT DES DONNÉES ==========

  private loadProjectsData(): Observable<PaginatedResponse<ProjectWithDetails>> {
    console.log('Loading projects data...');
    let params = new HttpParams().set('page', '1');
    if (this.projectFilters) {
      Object.keys(this.projectFilters).forEach(key => {
        const value = this.projectFilters[key as keyof ProjectFilter];
        if (value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    console.log('Project filters applied:', params.toString());
    return this.projectService.getProjects(1, this.projectFilters).pipe(
      tap(response => console.log('loadProjectsData response:', response)),
      catchError(error => {
        console.error('Error in loadProjectsData:', error);
        this.showToast(error.userMessage ?? 'Erreur lors du chargement des projets', 'error');
        return of({ count: 0, next: null, previous: null, results: [] } as PaginatedResponse<ProjectWithDetails>);
      })
    );
  }

  private loadEmployeesData(): Observable<UserSimple[]> {
    console.log('Loading employees data...');
    return this.employeeService.getEmployeesForProjects().pipe(
      tap(response => {
        console.log('Employees API response:', response);
        console.log('Employees loaded:', response.length);
        if (response.length === 0) {
          console.warn('No employees returned from API');
        }
      }),
      catchError(error => {
        console.error('Error loading employees:', error);
        const errorMessage = error.userMessage || 'Erreur lors du chargement des employés';
        this.showToast(errorMessage, 'error');
        if (error.status === 401) {
          console.log('Authentication error, logging out...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return of([]);
      })
    );
  }

  loadProjects(): void {
    console.log('Manual loadProjects called');
    this.isLoading = true;
    this.error = null;
    this.loadProjectsData().subscribe({
      next: (response) => {
        console.log('Manual loadProjects response:', response);
        this.projects = response.results || [];
        this.isLoading = false;
        if (this.projects.length === 0) {
          this.showToast('Aucun projet trouvé avec ces filtres', 'warning');
        } else {
          this.showToast(`${this.projects.length} projet(s) trouvé(s)`, 'success');
        }
      },
      error: (error) => {
        console.error('Error in manual loadProjects:', error);
        this.isLoading = false;
        this.error = error.userMessage || 'Erreur lors du chargement des projets';
        this.showToast(this.error ?? 'Erreur lors du chargement des projets', 'error');
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadTasks(): void {
    if (!this.selectedProject?.id) {
      console.warn('No selected project for loading tasks');
      return;
    }
    console.log('Loading tasks for project:', this.selectedProject.id);
    this.taskService.getTasksByProject(this.selectedProject.id).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading tasks:', error);
        this.showToast(error.userMessage || 'Erreur lors du chargement des tâches', 'error');
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return of([]);
      })
    ).subscribe(tasks => {
      this.tasks = tasks;

      // Charger les sous-tâches pour chaque tâche
      tasks.forEach(task => {
        if (task.id) {
          this.taskService.getSubtasksByTask(task.id).pipe(
            takeUntil(this.destroy$),
            catchError(error => {
              console.error('Error loading subtasks for task', task.id, error);
              return of([]);
            })
          ).subscribe((subtasks: SubTask[]) => {
            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              this.tasks[taskIndex].subtasks = subtasks;
            }
          });
        }
      });

      // Mettre à jour les tâches du projet sélectionné
      if (this.selectedProject) {
        this.selectedProject.tasks = tasks || [];
      }
    });
  }

  selectProject(project: ProjectWithDetails): void {
    console.log('Selecting project:', project);
    this.selectedProject = project;
    this.loadTasks();
  }

  // ========== MÉTHODES DE CONFIRMATION ==========

  executeConfirmation(): void {
    if (this.pendingConfirmAction) {
      this.pendingConfirmAction();
      this.pendingConfirmAction = null;
    }
    this.showConfirmModal = false;
  }

  cancelConfirmation(): void {
    this.pendingConfirmAction = null;
    this.showConfirmModal = false;
  }

  // ========== MÉTHODES UTILITAIRES ==========

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const id = Math.random().toString(36).substring(2);
    this.toasts.push({ id, message, type, timestamp: new Date() });
    setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
    }, 5000);
  }

  dismissToast(toastId: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== toastId);
  }

  getStatusLabel(status: string): string {
    return PROJECT_STATUS_LABELS[status as ProjectStatus] || status;
  }

  getTaskStatusLabel(status: string): string {
    return TASK_STATUS_LABELS[status as TaskStatus] || status;
  }

  getPriorityLabel(priority: string): string {
    return PRIORITY_LABELS[priority as Priority] || priority;
  }

  getEmployeeName(employee: UserSimple | null): string {
    if (!employee) {
      return 'Non assigné';
    }
    const fullName = employee.first_name && employee.last_name ? `${employee.first_name} ${employee.last_name}` : null;
    return fullName || employee.username || employee.email || `Employé #${employee.id}`;
  }

  // ========== MÉTHODES DE TRACKING POUR NGFOR ==========

  trackByProjectId(index: number, project: ProjectWithDetails): number {
    return project.id;
  }

  trackByTaskId(index: number, task: TaskWithDetails): number {
    return task.id || 0;
  }

  trackBySubtaskId(index: number, subtask: SubTask): number {
    return subtask.id;
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  // ========== MÉTHODES DE DÉBOGAGE (À SUPPRIMER EN PRODUCTION) ==========

  private logState(context: string): void {
    console.log(`=== STATE DEBUG [${context}] ===`);
    console.log('isCreatingProject:', this.isCreatingProject);
    console.log('isEditingProject:', this.isEditingProject);
    console.log('editingProjectId:', this.editingProjectId);
    console.log('editingProject:', this.editingProject);
    console.log('isSubmittingProject:', this.isSubmittingProject);
    console.log('currentProjectData:', this.currentProjectData);
    console.log('sessionStorage editingProject:', sessionStorage.getItem('editingProject'));
    console.log('========================');
  }

  // Méthode pour tester l'état manuellement (à appeler depuis la console)
  debugState(): void {
    this.logState('MANUAL DEBUG');
  }
}
