import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, Employee, EmployeeFilter, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { GamificationService, EmployeeStats } from '../../services/gamification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-employees.component.html',
  styleUrls: ['./admin-employees.component.css']
})
export class AdminEmployeesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Data
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  stats: any = null;
  selectedEmployee: Employee | null = null;
  employeeWorkStats: { [key: number]: any } = {};

  // Getter pour filteredEmployees avec fallback
  get safeFilteredEmployees(): Employee[] {
    return this.filteredEmployees || [];
  }

  // États
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showForm: boolean = false;
  isEditMode: boolean = false;
  showImportModal: boolean = false;
  showDeleteModal: boolean = false;
  showDetailsModal: boolean = false;
  showObjectivesModal: boolean = false;
  isSubmittingObjectives: boolean = false;
  selectedEmployeeStats: any = null;

  // Filtres
  searchTerm: string = '';
  statusFilter: string = '';
  positionFilter: string = '';
  ordering: string = '-created_at';

  // Formulaires
  employeeForm: FormGroup;
  importForm: FormGroup;
  objectivesForm: FormGroup;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';
  importResult: { imported_count: number; errors: string[] } | null = null;
  // Backend field errors mapping
  serverErrors: { [key: string]: string[] } = {};

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private http: HttpClient,
    private gamificationService: GamificationService
  ) {
    this.employeeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      generate_password: [true],
      position: ['', Validators.required],
      phone: [''],
      address: [''],
      hire_date: [''],
      birth_date: [''],
      salary: [null]
    });

    this.importForm = this.fb.group({
      file: [null, Validators.required]
    });

    this.objectivesForm = this.fb.group({
      target_subtasks: [200, [Validators.required, Validators.min(1), Validators.max(1000)]],
      target_hours: [8.0, [Validators.required, Validators.min(1), Validators.max(24)]],
      objective_date: ['']
    });
  }

  // Normalize payload before sending to backend: dates to YYYY-MM-DD, empty strings to null
  private normalizeEmployeePayload(payload: any): any {
    const normalized: any = { ...payload };

    const toYMD = (val: any): string | null => {
      if (val === undefined || val === null || val === '') return null;
      const s = String(val).trim();
      // If already YYYY-MM-DD, keep as is
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

    if ('birth_date' in normalized) normalized.birth_date = toYMD(normalized.birth_date);
    if ('hire_date' in normalized) normalized.hire_date = toYMD(normalized.hire_date);

    // Convert empty strings to null for optional fields
    ['phone', 'address', 'first_name', 'last_name', 'email'].forEach((k) => {
      if (k in normalized && (normalized[k] === '' || normalized[k] === undefined)) {
        normalized[k] = null;
      }
    });

    return normalized;
  }

  ngOnInit(): void {
    // Assurer l'authentification avant de charger les données
    this.checkAuthAndLoadData();
  }

  private checkAuthAndLoadData(): void {
    console.log('🔐 [AdminEmployees] Vérification de l\'authentification...');

    if (!this.authService.isAuthenticated()) {
      console.warn('⚠️ [AdminEmployees] Utilisateur non authentifié, redirection vers /login.');
      this.router.navigate(['/login']);
      return;
    }

    console.log('✅ [AdminEmployees] Utilisateur authentifié, vérification du profil...');

    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        console.log('👤 [AdminEmployees] Profil utilisateur:', user);
        if (!this.hasAdminPermissions(user)) {
          console.warn('⚠️ [AdminEmployees] Permissions insuffisantes');
          this.showError('Accès refusé : Vous devez être administrateur.');
          this.router.navigate(['/dashboard']);
          return;
        }
        console.log('✅ [AdminEmployees] Permissions validées, chargement des données');
        this.loadAllData();
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur profil:', error);
        if (error.status === 401) {
          console.warn('⚠️ [AdminEmployees] Token expiré ou invalide, redirection vers /login.');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          console.error('❌ [AdminEmployees] Erreur inattendue:', error);
          this.showError('Erreur lors de la vérification du profil utilisateur');
        }
      }
    });
  }

  private hasAdminPermissions(user: any): boolean {
    return user.role?.toUpperCase() === 'ADMIN';
  }

  private loadAllData(): void {
    this.isLoading = true;
    this.loadEmployees();
    this.loadStats();
    this.loadEmployeeWorkStats();
  }

  loadEmployees(): void {
    console.log('🔍 [AdminEmployees] Chargement des employés');

    const filters: EmployeeFilter = {
      search: this.searchTerm,
      position: this.positionFilter || undefined,
      ordering: this.ordering
    };

    this.employeeService.getEmployees(filters).subscribe({
      next: (response) => {
        console.log('✅ [AdminEmployees] Employés chargés:', response);
        const allEmployees = response.results || response;
        
        // Ensure allEmployees is an array before filtering
        if (!Array.isArray(allEmployees)) {
          console.error('ERROR: allEmployees is not an array:', allEmployees);
          this.employees = [];
          this.filteredEmployees = [];
          return;
        }
        
        // Filtrer pour exclure les administrateurs (basé sur le rôle ou email admin)
        this.employees = allEmployees.filter((employee: Employee) => 
          !employee.email?.includes('admin') && 
          employee.position !== 'Administrateur' &&
          employee.position !== 'Admin'
        );
        this.filteredEmployees = this.employees;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur lors du chargement des employés:', error);
        this.showError('Erreur lors du chargement des employés');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStats(): void {
    console.log('📊 [AdminEmployees] Chargement des statistiques');

    this.employeeService.getEmployeeStats().subscribe({
      next: (stats: any) => {
        console.log('✅ [AdminEmployees] Statistiques chargées');
        this.stats = stats;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur chargement stats:', error);
        if (error.status === 401) {
          console.warn('⚠️ [AdminEmployees] Token expiré lors du chargement des stats');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.showError('Erreur lors du chargement des statistiques');
        }
      }
    });
  }

  // Recherche et filtres
  onSearch(): void {
    console.log('🔍 [AdminEmployees] Recherche avec terme:', this.searchTerm);
    this.loadEmployees();
  }

  onFilterChange(): void {
    console.log('✅ [AdminEmployees] Chargement des données...');
    this.loadEmployees();
    this.loadStats();
    this.loadEmployeeWorkStats();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.positionFilter = '';
    this.ordering = '-created_at';
    this.loadEmployees();
  }

  // CRUD Operations
  // Gestion des employés
  createEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.showError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    this.isSubmitting = true;
    const formData = this.employeeForm.value;

    // Créer l'employé directement - le backend générera automatiquement le matricule
    this.submitEmployeeCreation(formData);
  }



  private submitEmployeeCreation(formData: any): void {
    const employeeData: CreateEmployeeRequest = this.normalizeEmployeePayload({
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      generate_password: formData.generate_password === null ? true : formData.generate_password,
      position: formData.position,
      hire_date: formData.hire_date,
      address: formData.address,
      salary: formData.salary
    }) as CreateEmployeeRequest;

    this.employeeService.createEmployee(employeeData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.serverErrors = {};
        this.showSuccess('Employé créé avec succès');
        this.closeForm();
        this.loadEmployees();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.applyServerErrors(error?.error?.details);
        this.showError('Erreur lors de la création: ' + (error?.message || 'Données invalides'));
      }
    });
  }

  updateEmployee(): void {
    if (!this.selectedEmployee || this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting = true;
    const employeeData: UpdateEmployeeRequest = this.normalizeEmployeePayload(this.employeeForm.value) as UpdateEmployeeRequest;

    console.log(`✏️ [AdminEmployees] Mise à jour employé ${this.selectedEmployee.id}:`, employeeData);

    this.employeeService.updateEmployee(this.selectedEmployee.id, employeeData).subscribe({
      next: (response) => {
        console.log('✅ [AdminEmployees] Employé mis à jour:', response?.id);
        this.serverErrors = {};
        this.showSuccess('Employé mis à jour avec succès');
        this.closeForm();
        this.loadEmployees();
        this.loadStats();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur mise à jour:', error);
        this.applyServerErrors(error?.error?.details);
        this.showError('Erreur lors de la mise à jour de l\'employé');
        this.isSubmitting = false;
      }
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'employé ${employee.full_name} ?`)) {
      return;
    }

    console.log(`🗑️ [AdminEmployees] Suppression employé ${employee.id}`);
    this.isLoading = true;

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        console.log('✅ [AdminEmployees] Employé supprimé');
        this.showSuccess('Employé supprimé avec succès');
        this.loadEmployees();
        this.loadStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur suppression:', error);
        let errorMessage = 'Erreur lors de la suppression de l\'employé';
        
        if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour supprimer cet employé';
        } else if (error.status === 404) {
          errorMessage = 'Employé non trouvé';
        } else if (error.status === 400 && error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Gestion des statuts
  toggleEmployeeStatus(employee: Employee): void {
    const newStatus = !employee.is_active;
    console.log(`🔄 [AdminEmployees] Changement statut employé ${employee.id} vers ${newStatus ? 'actif' : 'inactif'}`);

    // Mettre à jour localement d'abord
    employee.is_active = newStatus;

    // Appeler le service pour mettre à jour le backend
    this.employeeService.toggleEmployeeStatus(employee.id, newStatus).subscribe({
      next: (response) => {
        console.log('✅ [AdminEmployees] Statut changé:', response.message);
        this.showSuccess(response.message || 'Statut mis à jour avec succès');
        this.loadEmployees();
        this.loadStats();
      },
      error: (error: any) => {
        console.error('❌ [AdminEmployees] Erreur changement statut:', error);
        // Restaurer l'ancien statut en cas d'erreur
        employee.is_active = !newStatus;
        this.showError('Erreur lors du changement de statut');
      }
    });
  }

  // Map backend validation errors to specific controls and local serverErrors
  private applyServerErrors(details: any): void {
    if (!details || typeof details !== 'object') {
      return;
    }
    this.serverErrors = {};
    Object.keys(details).forEach((key) => {
      const messages = Array.isArray(details[key]) ? details[key] : [String(details[key])];
      this.serverErrors[key] = messages;
      const control = this.employeeForm.get(key);
      if (control) {
        const currentErrors = control.errors || {};
        control.setErrors({ ...currentErrors, server: true });
        control.markAsTouched();
      }
    });
  }

  // Export/Import
  exportEmployees(): void {
    console.log('📤 [AdminEmployees] Export des employés');

    this.employeeService.exportEmployees().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess('Export réalisé avec succès');
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur export:', error);
        this.showError('Erreur lors de l\'export');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.importForm.patchValue({ file });
    }
  }

  importEmployees(): void {
    if (this.importForm.invalid) {
      this.showError('Veuillez sélectionner un fichier CSV');
      return;
    }

    const file = this.importForm.get('file')?.value;
    if (!file) {
      this.showError('Aucun fichier sélectionné');
      return;
    }

    this.isSubmitting = true;
    console.log('📥 [AdminEmployees] Import des employés');

    this.employeeService.importEmployees(file).subscribe({
      next: (result) => {
        console.log('✅ [AdminEmployees] Import terminé:', result);
        this.importResult = result;
        this.showSuccess(`${result.imported_count} employés importés avec succès`);
        this.loadEmployees();
        this.loadStats();
        this.closeImportModal();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ [AdminEmployees] Erreur import:', error);
        this.showError('Erreur lors de l\'import');
        this.isSubmitting = false;
      }
    });
  }

  // Génération de matricule
  generateMatricule(): void {
    console.log('🆔 [AdminEmployees] Génération matricule');

    this.employeeService.generateMatricule().subscribe({
      next: (response: any) => {
        console.log('✅ [AdminEmployees] Matricule généré:', response.matricule);
        this.employeeForm.patchValue({ matricule: response.matricule });
        this.showSuccess('Matricule généré automatiquement');
      },
      error: (error: any) => {
        console.error('❌ [AdminEmployees] Erreur génération matricule:', error);
        this.showError('Erreur lors de la génération du matricule');
      }
    });
  }

  // Gestion des formulaires
  openCreateForm(): void {
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({
      hire_date: new Date().toISOString().split('T')[0]
    });
    this.showForm = true;
  }

  openEditForm(employee: Employee): void {
    this.isEditMode = true;
    this.selectedEmployee = employee;
    // Fallback pour les noms si user_details est absent
    let firstName = employee.user_details?.first_name || '';
    let lastName = employee.user_details?.last_name || '';
    if ((!firstName || !lastName) && employee.full_name) {
      const parts = employee.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        firstName = firstName || parts[0];
        lastName = lastName || parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        firstName = firstName || parts[0];
      }
    }

    // Normaliser les dates au format YYYY-MM-DD pour l'input type=date
    const toYMD = (val: string | null | undefined): string => {
      if (!val) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return '';
    };

    this.employeeForm.patchValue({
      email: employee.email || '',
      first_name: firstName,
      last_name: lastName,
      generate_password: false, // Ne pas générer de mot de passe lors de l'édition
      position: employee.position || '',
      phone: employee.phone || '',
      address: employee.address || '',
      hire_date: toYMD(employee.hire_date),
      birth_date: toYMD(employee.birth_date),
      salary: employee.salary || null
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.employeeForm.reset();
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.importForm.reset();
    this.importResult = null;
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.importForm.reset();
    this.importResult = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openDetailsModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedEmployee = null;
  }

  // Utilitaires
  getActiveStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getActiveStatusLabel(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  getInitials(employee: Employee): string {
    if (employee.user_details && employee.user_details.first_name && employee.user_details.last_name) {
      return (employee.user_details.first_name.charAt(0) + employee.user_details.last_name.charAt(0)).toUpperCase();
    } else if (employee.user_details && employee.user_details.username) {
      return employee.user_details.username.substring(0, 2).toUpperCase();
    } else if (employee.matricule) {
      return employee.matricule.substring(0, 2).toUpperCase();
    }
    return '??';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatSalary(salary: number | null | undefined): string {
    if (salary === null || salary === undefined) return 'Non défini';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(salary);
  }

  // Messages
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  // Tracking pour ngFor
  trackByEmployeeId(index: number, employee: Employee): number {
    return employee.id;
  }

  // Méthodes pour les statistiques de travail
  getEmployeeWorkStats(employee: Employee): any {
    return this.employeeWorkStats[employee.id] || null;
  }

  getDailyProgressPercentage(employee: Employee): number {
    const stats = this.getEmployeeWorkStats(employee);
    if (!stats || !stats.total_hours_today) return 0;
    return Math.min((stats.total_hours_today / 8) * 100, 100);
  }

  getSessionStatusClass(employee: Employee): string {
    const stats = this.getEmployeeWorkStats(employee);
    const status = stats?.current_session_status || 'none';
    
    switch (status) {
      case 'active': return 'session-active';
      case 'paused': return 'session-paused';
      default: return 'session-none';
    }
  }

  getSessionStatusIcon(employee: Employee): string {
    const stats = this.getEmployeeWorkStats(employee);
    const status = stats?.current_session_status || 'none';
    
    switch (status) {
      case 'active': return 'fa-play-circle';
      case 'paused': return 'fa-pause-circle';
      default: return 'fa-stop-circle';
    }
  }

  getSessionStatusLabel(employee: Employee): string {
    const stats = this.getEmployeeWorkStats(employee);
    const status = stats?.current_session_status || 'none';
    
    switch (status) {
      case 'active': return 'En cours';
      case 'paused': return 'En pause';
      default: return 'Arrêtée';
    }
  }

  // Charger les statistiques de travail pour tous les employés
  loadEmployeeWorkStats(): void {
    // Désactiver temporairement le chargement des stats de travail
    // car l'endpoint n'existe pas encore dans le backend
    console.log('⚠️ [AdminEmployees] Chargement des stats de travail désactivé temporairement');
  }

  // === MÉTHODES POUR LA GESTION DES OBJECTIFS DE GAMIFICATION ===

  openObjectivesModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.showObjectivesModal = true;
    
    // Charger les statistiques de gamification de l'employé
    this.loadEmployeeGamificationStats(employee);
    
    // Réinitialiser le formulaire avec les valeurs par défaut
    this.objectivesForm.patchValue({
      target_subtasks: 200,
      target_hours: 8.0,
      objective_date: ''
    });
  }

  closeObjectivesModal(): void {
    this.showObjectivesModal = false;
    this.selectedEmployee = null;
    this.selectedEmployeeStats = null;
    this.isSubmittingObjectives = false;
  }

  loadEmployeeGamificationStats(employee: Employee): void {
    // Charger les vraies statistiques de gamification depuis l'API
    this.gamificationService.getEmployeeStats({ employee: employee.id }).subscribe({
      next: (stats: EmployeeStats[]) => {
        if (stats && stats.length > 0) {
          const employeeStats = stats[0];
          this.selectedEmployeeStats = {
            total_stars: employeeStats.total_stars,
            total_points: employeeStats.total_points,
            current_level: employeeStats.current_level,
            total_badges: employeeStats.total_badges
          };
        } else {
          // Stats par défaut si l'employé n'a pas encore de données
          this.selectedEmployeeStats = {
            total_stars: 0,
            total_points: 0,
            current_level: 'Débutant',
            total_badges: 0
          };
        }
        console.log(`📊 Stats chargées pour ${employee.full_name}:`, this.selectedEmployeeStats);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des stats:', error);
        // Stats par défaut en cas d'erreur
        this.selectedEmployeeStats = {
          total_stars: 0,
          total_points: 0,
          current_level: 'Débutant',
          total_badges: 0
        };
      }
    });
  }

  saveObjectives(): void {
    if (this.objectivesForm.invalid || !this.selectedEmployee) {
      return;
    }

    this.isSubmittingObjectives = true;
    const formData = this.objectivesForm.value;
    
    // Préparer les données pour l'API
    const objectiveData = {
      employee: this.selectedEmployee.id,
      target_subtasks: formData.target_subtasks,
      target_hours: formData.target_hours,
      date: formData.objective_date || new Date().toISOString().split('T')[0]
    };

    console.log('💾 Sauvegarde des objectifs:', objectiveData);

    // Appel à la vraie API de gamification
    this.gamificationService.createDailyObjective(objectiveData).subscribe({
      next: (response) => {
        this.successMessage = `Objectifs définis avec succès pour ${this.selectedEmployee?.full_name}: ${formData.target_subtasks} sous-tâches, ${formData.target_hours}h par jour`;
        this.isSubmittingObjectives = false;
        this.closeObjectivesModal();
        
        console.log('✅ Objectifs sauvegardés:', response);
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la sauvegarde des objectifs:', error);
        this.errorMessage = 'Erreur lors de la sauvegarde des objectifs. Veuillez réessayer.';
        this.isSubmittingObjectives = false;
        
        // Effacer le message d'erreur après 5 secondes
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }
}

