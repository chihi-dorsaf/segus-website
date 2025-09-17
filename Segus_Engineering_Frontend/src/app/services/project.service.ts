import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, retry, switchMap, map } from 'rxjs/operators';
import {
  Project,
  ProjectWithDetails,
  CreateProject,
  UpdateProject,
  ProjectFilter,
  ProjectStats,
  PaginatedResponse
} from '../models/project.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/api/projects`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('ProjectService initialized with API URL:', this.apiUrl);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token found for authentication');
      throw new Error('Authentication required - no token');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error occurred:', error);
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
          errorMessage = 'Accès refusé.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText || error.message}`;
      }
    }
    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }

  getProjects(page: number = 1, filters?: ProjectFilter): Observable<PaginatedResponse<ProjectWithDetails>> {
    let params = new HttpParams().set('page', page.toString());
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ProjectFilter];
        if (value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<any>(`${this.apiUrl}/`, { params, headers: this.getAuthHeaders() }).pipe(
          map(response => {
            let processedResponse: PaginatedResponse<ProjectWithDetails>;
            if (Array.isArray(response)) {
              processedResponse = { count: response.length, next: null, previous: null, results: response };
            } else {
              processedResponse = response as PaginatedResponse<ProjectWithDetails>;
              if (!processedResponse.results) processedResponse.results = [];
            }
            return processedResponse;
          }),
          retry(2),
          catchError(error => {
            if (error.status === 401) {
              this.authService.logout();
            }
            return this.handleError(error);
          })
        );
      })
    );
  }

  getAllProjects(): Observable<ProjectWithDetails[]> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails[]>(`${this.apiUrl}/all/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getProject(id: number): Observable<ProjectWithDetails> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails>(`${this.apiUrl}/${id}/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  createProject(project: CreateProject): Observable<ProjectWithDetails> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.post<ProjectWithDetails>(`${this.apiUrl}/`, project, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  updateProject(id: number, project: UpdateProject): Observable<ProjectWithDetails> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.patch<ProjectWithDetails>(`${this.apiUrl}/${id}/`, project, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  // Nouvelle méthode pour assigner plusieurs employés
  assignEmployees(projectId: number, employeeIds: number[]): Observable<ProjectWithDetails> {
    console.log('assignEmployees called with:', { projectId, employeeIds });
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.patch<ProjectWithDetails>(
          `${this.apiUrl}/${projectId}/`,
          { assigned_employee_ids: employeeIds },
          { headers: this.getAuthHeaders() }
        ).pipe(
          tap(() => console.log('assignEmployees successful')),
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.delete<void>(`${this.apiUrl}/${id}/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getProjectStats(id: number): Observable<ProjectStats> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectStats>(`${this.apiUrl}/${id}/stats/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getMyProjects(): Observable<ProjectWithDetails[]> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails[]>(`${this.apiUrl}/my-projects/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  duplicateProject(id: number, name: string): Observable<ProjectWithDetails> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.post<ProjectWithDetails>(`${this.apiUrl}/${id}/duplicate/`, { name }, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  archiveProject(id: number): Observable<void> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.post<void>(`${this.apiUrl}/${id}/archive/`, {}, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  restoreProject(id: number): Observable<void> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.post<void>(`${this.apiUrl}/${id}/restore/`, {}, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getProjectsByStatus(status: string): Observable<ProjectWithDetails[]> {
    const params = new HttpParams().set('status', status);
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails[]>(`${this.apiUrl}/by-status/`, { params, headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  searchProjects(query: string): Observable<ProjectWithDetails[]> {
    const params = new HttpParams().set('search', query);
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails[]>(`${this.apiUrl}/search/`, { params, headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getGlobalStats(): Observable<ProjectStats> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectStats>(`${this.apiUrl}/global-stats/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  updateProjectStatus(id: number, status: string): Observable<ProjectWithDetails> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.patch<ProjectWithDetails>(`${this.apiUrl}/${id}/`, { status }, { headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  getRecentProjects(limit: number = 5): Observable<ProjectWithDetails[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get<ProjectWithDetails[]>(`${this.apiUrl}/recent/`, { params, headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  exportProjects(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get(`${this.apiUrl}/export/`, { params, responseType: 'blob', headers: this.getAuthHeaders() }).pipe(
          catchError(this.handleError.bind(this))
        );
      })
    );
  }

  testApiConnectivity(): Observable<any> {
    return this.authService.fetchCurrentUser().pipe(
      switchMap(() => {
        return this.http.get(`${this.apiUrl}/`, { headers: this.getAuthHeaders() }).pipe(
          catchError(error => {
            console.error('API connectivity test failed:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  getDebugInfo(): any {
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    return {
      apiUrl: this.apiUrl,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      currentUser: currentUser,
      environment: environment
    };
  }

  testSimpleGet(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`).pipe(
      catchError(error => {
        console.error('Simple GET failed:', error);
        return of({ error: 'Simple GET failed', details: error });
      })
    );
  }
}
