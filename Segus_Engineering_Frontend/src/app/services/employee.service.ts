import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { UserSimple } from '../models/project.model';

export interface Employee {
  id: number;
  matricule: string;
  position: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  salary?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_photo?: string;
  // Computed properties from backend
  full_name: string;
  email: string;
  // User details (if available)
  user_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'EMPLOYE';
    is_active: boolean;
  };
}

export interface CreateEmployeeRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  generate_password?: boolean;
  position: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  salary?: number;
  matricule?: string; // Optionnel - généré automatiquement par le backend
}

export interface UpdateEmployeeRequest {
  position?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  salary?: number;
  is_active?: boolean;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  average_salary: number | null;
  recent_hires: number;
}

export interface EmployeeFilter {
  search?: string;
  status?: string;
  position?: string;
  ordering?: string;
}

export interface ImportResult {
  message: string;
  imported_count: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.employeesUrl}/`; // Correct base: /api/employees/
  private usersApiUrl = `${environment.usersUrl}/`; // Correct users base: /api/users/

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('EmployeeService initialized with API URLs:', {
      employees: this.apiUrl,
      users: this.usersApiUrl
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No authentication token available');
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error occurred:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vérifiez vos permissions.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée. Vérifiez l\'URL de l\'API.';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur. Consultez les logs du serveur.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText || error.message}`;
      }
    }
    return throwError(() => ({
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      error: error.error
    }));
  }

  getEmployeesForProjects(): Observable<UserSimple[]> {
    console.log('🔍 [EmployeeService] Requesting employees for projects from:', `${this.usersApiUrl}employees/`);
    return this.http.get<UserSimple[]>(`${this.usersApiUrl}employees/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ [EmployeeService] Fetched employees for projects:', response);
        if (response.length === 0) {
          console.warn('⚠️ [EmployeeService] No employees returned. Check database or endpoint configuration.');
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getEmployees(filters?: EmployeeFilter): Observable<{ count: number; results: Employee[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof EmployeeFilter];
        if (value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    console.log('🔍 [EmployeeService] Requesting employees with params:', params.toString());
    return this.http.get<{ count: number; results: Employee[] }>(this.apiUrl, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`✅ [EmployeeService] ${response.count} employees fetched successfully`)),
      catchError(this.handleError.bind(this))
    );
  }

  getEmployee(id: number): Observable<Employee> {
    console.log(`🔍 [EmployeeService] Requesting employee with id: ${id}`);
    return this.http.get<Employee>(`${this.apiUrl}${id}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('✅ [EmployeeService] Employee fetched successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  createEmployee(employee: CreateEmployeeRequest): Observable<Employee> {
    console.log('➕ [EmployeeService] Creating employee:', employee);
    return this.http.post<Employee>(this.apiUrl, employee, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ [EmployeeService] Employee created successfully:', response?.id)),
      catchError(this.handleError.bind(this))
    );
  }

  updateEmployee(id: number, employee: UpdateEmployeeRequest): Observable<Employee> {
    console.log(`✏️ [EmployeeService] Updating employee ${id}:`, employee);
    return this.http.patch<Employee>(`${this.apiUrl}${id}/`, employee, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ [EmployeeService] Employee updated successfully:', response?.id)),
      catchError(this.handleError.bind(this))
    );
  }

  deleteEmployee(id: number): Observable<void> {
    console.log(`🗑️ [EmployeeService] Deleting employee ${id}`);
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap(() => console.log('✅ [EmployeeService] Employee deleted successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  getEmployeeStats(): Observable<EmployeeStats> {
    console.log('📊 [EmployeeService] Requesting employee stats');
    return this.http.get<EmployeeStats>(`${this.apiUrl}stats/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(stats => console.log('✅ [EmployeeService] Employee stats fetched successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  exportEmployees(): Observable<Blob> {
    console.log('📤 [EmployeeService] Exporting employees to CSV');
    return this.http.get(`${this.apiUrl}export/`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      tap(() => console.log('✅ [EmployeeService] Employees exported successfully')),
      catchError(this.handleError.bind(this))
    );
  }

  importEmployees(file: File): Observable<ImportResult> {
    console.log('📥 [EmployeeService] Importing employees from CSV');
    const formData = new FormData();
    formData.append('file', file);
    // Note: Do not set Content-Type header for FormData; browser handles it
    const headers = this.getAuthHeaders().delete('Content-Type');
    return this.http.post<ImportResult>(`${this.apiUrl}import/`, formData, {
      headers
    }).pipe(
      tap(result => console.log(`✅ [EmployeeService] ${result.imported_count} employees imported successfully`)),
      catchError(this.handleError.bind(this))
    );
  }

  generateMatricule(): Observable<{ matricule: string }> {
    console.log('🆔 [EmployeeService] Generating matricule');
    return this.http.get<{ matricule: string }>(`${this.apiUrl}generate-matricule/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ [EmployeeService] Matricule generated:', response.matricule)),
      catchError(this.handleError.bind(this))
    );
  }

  searchEmployees(query: string): Observable<{ count: number; results: Employee[] }> {
    console.log(`🔍 [EmployeeService] Searching employees with query: ${query}`);
    const params = new HttpParams().set('q', query);
    return this.http.get<{ count: number; results: Employee[] }>(`${this.apiUrl}search/`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`✅ [EmployeeService] Search completed: ${response.count} results found`)),
      catchError(this.handleError.bind(this))
    );
  }

  toggleEmployeeStatus(employeeId: number, newActive: boolean): Observable<{ message: string; employee: Employee }> {
    console.log(`🔄 [EmployeeService] Toggling employee ${employeeId} active to ${newActive}`);
    const payload = { status: newActive ? 'ACTIVE' : 'INACTIVE' };
    return this.http.patch<{ message: string; employee: Employee }>(`${this.apiUrl}${employeeId}/toggle-status/`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ [EmployeeService] Employee status updated successfully:', response.message)),
      catchError(this.handleError.bind(this))
    );
  }

  // --- Espace Employé (FrontOffice) ---
  getEmployeeDashboard(): Observable<any> {
    return this.http.get<any>(`${environment.projectsUrl}/employee/dashboard/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getEmployeeTasks(status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any[]>(`${environment.projectsUrl}/employee/tasks/`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getEmployeeProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.projectsUrl}/employee/projects/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
