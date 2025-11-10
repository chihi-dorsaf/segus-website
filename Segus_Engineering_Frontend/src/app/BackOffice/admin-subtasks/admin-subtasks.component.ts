import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { EmployeeService } from '../../services/employee.service';
import {
  SubTask,
  Task,
  CreateSubTask,
  UpdateSubTask
} from '../../models/project.model';
import { Project, UserSimple } from '../../models/project.model';

@Component({
  selector: 'app-admin-subtasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subtasks.component.html',
  styleUrls: ['./admin-subtasks.component.css']
})
export class AdminSubtasksComponent implements OnInit {
  // Données
  subtasks: SubTask[] = [];
  filteredSubtasks: SubTask[] = [];
  tasks: Task[] = [];
  projects: Project[] = [];
  employees: UserSimple[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Tri
  sortField = 'section_name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtres
  filters = {
    search: '',
    task: '',
    project: '',
    assignee: '',
    completed: ''
  };

  // Modales
  showCreateSubtaskModal = false;
  showEditSubtaskModal = false;
  showAssignModal = false;
  showDeleteModal = false;

  // Menu contextuel
  showContextMenu = false;
  contextMenuX = 0;
  contextMenuY = 0;

  // Formulaires
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

  // États
  loading = false;
  selectedSubtask: SubTask | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  selectedProject = '';
  selectedAssignee = '';
  completedFilter = '';
  searchTerm = '';
  selectedTask = '';
  selectedProjectForTask = '';
  filteredTasksForProject: any[] = [];
  employeeSearchTerm = '';

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    // Synchroniser automatiquement les sous-tâches terminées par les employés
    this.startAutoSync();
  }

  // Chargement des données
  loadInitialData() {
    this.loading = true;
    Promise.all([
      this.loadSubtasks(),
      this.loadTasks(),
      this.loadProjects(),
      this.loadEmployees()
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadSubtasks() {
    const params: any = {};

    if (this.filters.task) {
      params.task = parseInt(this.filters.task);
    }
    if (this.filters.assignee) {
      params.employee = parseInt(this.filters.assignee);
    }
    if (this.filters.completed) {
      params.completed = this.filters.completed;
    }

    console.log('Loading subtasks with params:', params);
    return this.taskService.getSubtasks(params).toPromise().then((response: any) => {
      console.log('Subtasks response:', response);
      this.subtasks = response.results || response || [];
      this.totalItems = response.count || this.subtasks.length || 0;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.applyFilters();
      console.log('Loaded subtasks:', this.subtasks.length, 'items');
      
      // Synchroniser automatiquement après le chargement
      setTimeout(() => this.syncCompletedSubtasks(), 1000);
    }).catch(error => {
      console.error('Erreur lors du chargement des sous-tâches:', error);
    });
  }

  loadTasks() {
    return this.taskService.getTasks().toPromise().then((response: any) => {
      console.log('Tasks response:', response);
      this.tasks = response.results || response || [];
      console.log('Tasks loaded:', this.tasks.length, 'items');
    }).catch(error => {
      console.error('Erreur lors du chargement des tâches:', error);
    });
  }

  loadProjects() {
    return this.projectService.getProjects().toPromise().then((response: any) => {
      this.projects = response.results || [];
    }).catch(error => {
      console.error('Erreur lors du chargement des projets:', error);
    });
  }

  loadEmployees(): Promise<void> {
    // Essayer d'abord l'endpoint dédié aux utilisateurs employables pour projets/sous-tâches
    return this.employeeService
      .getEmployeesForProjects()
      .toPromise()
      .then((users) => {
        this.employees = Array.isArray(users) ? users : [];
        if (!this.employees.length) {
          // Fallback sur la liste paginée des employés
          return this.employeeService
            .getEmployees()
            .toPromise()
            .then((response: any) => {
              this.employees = response?.results || [];
            });
        }
        // Rien à faire de plus si la liste est non vide
        return Promise.resolve();
      })
      .catch(() => {
        // En cas d'erreur sur le premier endpoint, fallback direct
        return this.employeeService
          .getEmployees()
          .toPromise()
          .then((response: any) => {
            this.employees = response?.results || [];
          });
      });
  }

  // Filtrage et recherche
  applyFilters() {
    let filtered = [...this.subtasks];

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(subtask =>
        (subtask.section_name || '').toLowerCase().includes(search) ||
        (subtask.section_number || '').toLowerCase().includes(search) ||
        (subtask.section_id || '').toLowerCase().includes(search)
      );
    }

    if (this.filters.task) {
      filtered = filtered.filter(subtask => subtask.task.toString() === this.filters.task);
    }

    if (this.filters.assignee) {
      filtered = filtered.filter(subtask =>
        subtask.assigned_employees && subtask.assigned_employees.some(emp => emp.id.toString() === this.filters.assignee)
      );
    }

    if (this.filters.completed !== '') {
      const isCompleted = this.filters.completed === 'true';
      filtered = filtered.filter(subtask => subtask.is_completed === isCompleted);
    }

    // Apply sorting to filtered results
    if (this.sortField) {
      filtered.sort((a: any, b: any) => {
        let aValue = a[this.sortField];
        let bValue = b[this.sortField];
        
        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        
        // Convert to string for comparison
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
        
        if (this.sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    this.filteredSubtasks = filtered;
  }

  onFilterChange() {
    this.currentPage = 1;
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
      this.loadSubtasks();
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

  // Gestion des sous-tâches
  createSubtask() {
    if (!this.createSubtaskForm.task || this.createSubtaskForm.task === 0) {
      console.error('Aucune tâche sélectionnée');
      alert('Veuillez sélectionner une tâche');
      return;
    }

    console.log('Creating subtask with form:', this.createSubtaskForm);
    this.loading = true;
    this.taskService.createSubtask(this.createSubtaskForm).subscribe({
      next: (subtask) => {
        console.log('Subtask created successfully:', subtask);
        this.showCreateSubtaskModal = false;
        this.resetCreateSubtaskForm();
        this.loading = false;
        alert('Sous-tâche créée avec succès !');
        // Recharger toutes les données pour s'assurer de la cohérence
        this.loadInitialData();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la sous-tâche:', error);
        alert('Erreur lors de la création de la sous-tâche: ' + (error.userMessage || error.message || 'Erreur inconnue'));
        this.loading = false;
      }
    });
  }

  editSubtask() {
    if (!this.selectedSubtask) return;

    this.loading = true;
    this.taskService.updateSubtask(this.selectedSubtask.id, this.editSubtaskForm).subscribe({
      next: (updatedSubtask) => {
        const index = this.subtasks.findIndex(st => st.id === updatedSubtask.id);
        if (index !== -1) {
          this.subtasks[index] = updatedSubtask;
          this.filteredSubtasks = [...this.subtasks];
        }
        this.showEditSubtaskModal = false;
        this.selectedSubtask = null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la modification de la sous-tâche:', error);
        this.loading = false;
      }
    });
  }

  deleteSubtask(subtaskId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-tâche ?')) {
      this.loading = true;
      this.taskService.deleteSubtask(subtaskId).subscribe({
        next: () => {
          this.subtasks = this.subtasks.filter(st => st.id !== subtaskId);
          this.filteredSubtasks = [...this.subtasks];
          this.showDeleteModal = false;
          this.selectedSubtask = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la sous-tâche:', error);
          this.loading = false;
        }
      });
    }
  }

  // Méthode pour synchroniser automatiquement les sous-tâches terminées par les employés
  syncCompletedSubtasks() {
    console.log('🔄 Synchronisation des sous-tâches terminées par les employés...');
    
    // Récupérer toutes les sous-tâches avec leur statut actuel depuis l'API
    this.taskService.getAllSubtasksWithStatus().subscribe({
      next: (allSubtasks: SubTask[]) => {
        console.log('✅ Sous-tâches récupérées:', allSubtasks.length);
        
        // Mettre à jour les sous-tâches locales avec les statuts actuels
        let updatedCount = 0;
        allSubtasks.forEach(apiSubtask => {
          const localSubtask = this.subtasks.find(st => st.id === apiSubtask.id);
          if (localSubtask && localSubtask.is_completed !== apiSubtask.is_completed) {
            localSubtask.is_completed = apiSubtask.is_completed;
            localSubtask.completed_at = apiSubtask.completed_at;
            updatedCount++;
          }
        });
        
        if (updatedCount > 0) {
          console.log(`📊 ${updatedCount} sous-tâches synchronisées automatiquement`);
          this.applyFilters(); // Rafraîchir l'affichage
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la synchronisation:', error);
      }
    });
  }

  // Démarrer la synchronisation automatique
  startAutoSync() {
    // Synchroniser immédiatement
    this.syncCompletedSubtasks();
    
    // Puis synchroniser toutes les 30 secondes
    setInterval(() => {
      this.syncCompletedSubtasks();
    }, 30000);
  }

  // Méthode pour forcer une synchronisation manuelle
  forceSyncSubtasks() {
    console.log('🔄 Synchronisation manuelle forcée...');
    this.syncCompletedSubtasks();
  }

  toggleSubtask(subtask: SubTask) {
    // L'admin peut toujours modifier manuellement si nécessaire
    const shouldComplete = !subtask.is_completed;
    const request$ = shouldComplete
      ? this.taskService.markSubtaskCompleted(subtask.id)
      : this.taskService.markSubtaskUncompleted(subtask.id);

    request$.subscribe({
      next: () => {
        subtask.is_completed = shouldComplete;
        console.log(`✏️ Admin a modifié manuellement la sous-tâche ${subtask.id}`);
      },
      error: (error) => {
        console.error('Erreur lors du changement d\'état de la sous-tâche:', error);
      }
    });
  }

  assignEmployees() {
    if (!this.selectedSubtask) return;

    this.loading = true;
    const employeeIds = this.editSubtaskForm.assigned_employee_ids || [];

    this.taskService.assignEmployeesToSubtask(this.selectedSubtask.id, employeeIds).subscribe({
      next: (updatedSubtask: SubTask) => {
        console.log('Assignation réussie:', updatedSubtask);
        const index = this.subtasks.findIndex(st => st.id === updatedSubtask.id);
        if (index !== -1) {
          this.subtasks[index] = updatedSubtask;
          this.filteredSubtasks = [...this.subtasks];
        }
        this.showAssignModal = false;
        this.selectedSubtask = null;
        this.loading = false;
        console.log('Données avant rechargement:', this.subtasks.length);
        // Recharger les données pour s'assurer de la cohérence
        this.loadSubtasks();
        setTimeout(() => {
          console.log('Données après rechargement:', this.subtasks.length);
          alert('Employés assignés avec succès !');
        }, 1000);
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'assignation des employés:', error);
        alert('Erreur lors de l\'assignation des employés: ' + (error.userMessage || error.message || 'Erreur inconnue'));
        this.loading = false;
      }
    });
  }

  // Gestion des modales
  openCreateSubtaskModal() {
    console.log('Opening create subtask modal');
    this.resetCreateSubtaskForm();
    this.showCreateSubtaskModal = true;
    console.log('Modal state:', this.showCreateSubtaskModal);
    console.log('Tasks available:', this.tasks.length);
    console.log('Projects available:', this.projects.length);
    console.log('Employees available:', this.employees.length);
  }

  openEditSubtaskModal(subtask: SubTask) {
    this.selectedSubtask = subtask;
    this.editSubtaskForm = {
      section_name: subtask.section_name,
      section_number: subtask.section_number,
      section_id: subtask.section_id,
      kilometrage: subtask.kilometrage,
      assigned_employee_ids: subtask.assigned_employees.map(e => e.id)
    };
    this.showEditSubtaskModal = true;
  }

  openAssignModal(subtask: SubTask) {
    this.selectedSubtask = subtask;
    this.editSubtaskForm.assigned_employee_ids = subtask.assigned_employees.map(e => e.id);
    this.closeAllModals();
    this.showAssignModal = true;
  }

  openDeleteModal(subtask: SubTask) {
    this.selectedSubtask = subtask;
    this.showDeleteModal = true;
  }

  // Gestion du menu contextuel
  openSubtaskMenu(event: MouseEvent, subtask: SubTask) {
    event.preventDefault();
    this.selectedSubtask = subtask;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.showContextMenu = true;
  }

  closeContextMenu() {
    this.showContextMenu = false;
    this.selectedSubtask = null;
  }

  // Utilitaires
  resetCreateSubtaskForm() {
    this.createSubtaskForm = {
      section_name: '',
      section_number: '',
      section_id: '',
      kilometrage: 0,
      task: 0,
      assigned_employee_ids: []
    };
    console.log('Form reset:', this.createSubtaskForm);
  }

  getTaskTitle(taskId: number): string {
    const task = this.tasks.find(t => t.id === taskId);
    return task ? task.title : 'Tâche inconnue';
  }

  getProjectTitle(taskId: number): string {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return 'Projet inconnu';
    const project = this.projects.find(p => p.id === task.project);
    return project ? project.title : 'Projet inconnu';
  }

  // Méthodes de recherche et filtrage
  onSearchChange() {
    console.log('Search term changed:', this.searchTerm);
    this.filters.search = this.searchTerm;
    this.onFilterChange();
  }

  clearFilters() {
    this.filters = {
      search: '',
      task: '',
      project: '',
      assignee: '',
      completed: ''
    };
    this.searchTerm = '';
    this.selectedTask = '';
    this.selectedProject = '';
    this.selectedAssignee = '';
    this.completedFilter = '';
    this.onFilterChange();
  }

  onProjectChange() {
    console.log('Project changed:', this.selectedProjectForTask);
    this.filteredTasksForProject = this.tasks.filter(task => 
      task.project.toString() === this.selectedProjectForTask
    );
    this.createSubtaskForm.task = 0; // Reset task selection
    console.log('Filtered tasks:', this.filteredTasksForProject.length);
  }

  // Filtre de recherche pour la liste d'employés (création)
  get filteredEmployeesBySearch(): UserSimple[] {
    const term = (this.employeeSearchTerm || '').toLowerCase().trim();
    if (!term) return this.employees;
    return this.employees.filter(e =>
      (e.full_name || '').toLowerCase().includes(term) ||
      (e.username || '').toLowerCase().includes(term) ||
      (e.email || '').toLowerCase().includes(term)
    );
  }

  // Gestion des cases à cocher pour la création (assignation d'employés)
  toggleCreateEmployeeAssignment(employeeId: number, event: any) {
    const isChecked = event?.target?.checked ?? false;
    if (!Array.isArray(this.createSubtaskForm.assigned_employee_ids)) {
      this.createSubtaskForm.assigned_employee_ids = [];
    }
    const idx = this.createSubtaskForm.assigned_employee_ids.indexOf(employeeId);
    if (isChecked && idx === -1) {
      this.createSubtaskForm.assigned_employee_ids.push(employeeId);
    } else if (!isChecked && idx > -1) {
      this.createSubtaskForm.assigned_employee_ids.splice(idx, 1);
    }
  }

  // Sélection globale (vue liste)
  selectAll(event: any) {
    const isChecked = event?.target?.checked ?? false;
    this.filteredSubtasks.forEach(subtask => {
      (subtask as any).selected = isChecked;
    });
  }

  // Icône de tri pour l'entête de tableau
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fas fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Cases à cocher d'assignation (modale d'assignation)
  toggleEmployeeAssignment(employeeId: number, event: any) {
    const isChecked = event?.target?.checked ?? false;
    if (!this.editSubtaskForm.assigned_employee_ids) {
      this.editSubtaskForm.assigned_employee_ids = [];
    }
    if (isChecked) {
      if (!this.editSubtaskForm.assigned_employee_ids.includes(employeeId)) {
        this.editSubtaskForm.assigned_employee_ids.push(employeeId);
      }
    } else {
      const index = this.editSubtaskForm.assigned_employee_ids.indexOf(employeeId);
      if (index > -1) {
        this.editSubtaskForm.assigned_employee_ids.splice(index, 1);
      }
    }
  }

  // Fermer toutes les modales
  closeAllModals() {
    this.showCreateSubtaskModal = false;
    this.showEditSubtaskModal = false;
    this.showAssignModal = false;
    this.showDeleteModal = false;
  }
}
