import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { TaskWithDetails, CreateTask, UpdateTask, SubTask } from '../models/project.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/api/tasks/`;
  private subtaskApiUrl = `${environment.apiUrl}/api/subtasks/`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private formatTaskPayload(task: CreateTask | UpdateTask): any {
    const payload: any = {
      title: task.title?.trim(),
      description: task.description?.trim() || '',
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM'
    };

    // Ajouter le project seulement pour la création
    if ('project' in task && task.project) {
      payload.project = task.project;
    }

    // Formater les dates
    if (task.start_date) {
      payload.start_date = this.formatDate(task.start_date);
    }

    if (task.end_date) {
      payload.end_date = this.formatDate(task.end_date);
    }

    // Ajouter les employés assignés
    if (task.assigned_employee_ids && Array.isArray(task.assigned_employee_ids)) {
      payload.assigned_employee_ids = task.assigned_employee_ids.filter((id: number) => id != null);
    }

    console.log('Formatted task payload:', payload);
    return payload;
  }

  private formatDate(date: string | Date): string {
    if (!date) return '';

    if (typeof date === 'string') {
      // Si c'est déjà au format YYYY-MM-DD, on le retourne tel quel
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Sinon on essaie de le parser
      date = new Date(date);
    }

    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    return '';
  }

  // Test de connexion
  testConnection(): Observable<any> {
    console.log('Testing connection to:', this.apiUrl);
    return this.http.get(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Connection test successful:', response)),
      catchError(error => {
        console.error('Connection test failed:', error);
        return throwError(() => error);
      })
    );
  }

  createTask(task: CreateTask): Observable<TaskWithDetails> {
    console.log('Creating task with original data:', task);

    // Validation basique
    if (!task.title?.trim()) {
      return throwError(() => ({
        status: 400,
        error: { title: ['Le titre est requis'] },
        userMessage: 'Le titre de la tâche est requis'
      }));
    }

    if (!task.project) {
      return throwError(() => ({
        status: 400,
        error: { project: ['Le projet est requis'] },
        userMessage: 'Le projet est requis'
      }));
    }

    const payload = this.formatTaskPayload(task);

    return this.http.post<TaskWithDetails>(this.apiUrl, payload, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Task created successfully:', response)),
      catchError((error) => {
        console.error('Error in createTask:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          body: error.error,
          url: error.url
        });

        let userMessage = 'Erreur lors de la création de la tâche';

        if (error.status === 400 && error.error) {
          const validationErrors = this.formatValidationErrors(error.error);
          userMessage = `Erreur de validation : ${validationErrors}`;
        } else if (error.status === 401) {
          return this.handle401Error(() => this.createTask(task));
        } else if (error.status === 403) {
          userMessage = 'Vous n\'avez pas les permissions pour créer une tâche';
        } else if (error.status === 404) {
          userMessage = 'Le projet spécifié n\'existe pas';
        } else if (error.status === 500) {
          userMessage = 'Erreur serveur. Veuillez réessayer plus tard';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  getTasksByProject(projectId: number): Observable<TaskWithDetails[]> {
    if (!projectId || projectId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de projet invalide'
      }));
    }

    const params = new HttpParams().set('project', projectId.toString());
    console.log('Getting tasks for project:', projectId);

    return this.http.get<TaskWithDetails[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      tap(response => console.log(`Found ${response.length} tasks for project ${projectId}`)),
      catchError((error) => {
        console.error('Error in getTasksByProject:', error);
        let userMessage = 'Erreur lors du chargement des tâches';

        if (error.status === 401) {
          return this.handle401Error(() => this.getTasksByProject(projectId));
        } else if (error.status === 404) {
          userMessage = 'Projet non trouvé';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  getAllTasks(): Observable<TaskWithDetails[]> {
    return this.http.get<TaskWithDetails[]>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log(`Found ${response.length} total tasks`)),
      catchError((error) => {
        console.error('Error in getAllTasks:', error);
        let userMessage = 'Erreur lors du chargement des tâches';

        if (error.status === 401) {
          return this.handle401Error(() => this.getAllTasks());
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  getTasks(filters?: { project?: number; status?: string; employee?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.project) params = params.set('project', String(filters.project));
    if (filters?.status) params = params.set('status', String(filters.status));
    if (filters?.employee) params = params.set('employee', String(filters.employee));
    
    console.log('Fetching tasks with params:', params.toString());
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params }).pipe(
      tap(response => console.log('Tasks API response:', response)),
      catchError((error) => {
        console.error('Error in getTasks:', error);
        return throwError(() => error);
      })
    );
  }

  getTaskById(taskId: number): Observable<TaskWithDetails> {
    if (!taskId || taskId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de tâche invalide'
      }));
    }

    return this.http.get<TaskWithDetails>(`${this.apiUrl}${taskId}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Task retrieved:', response)),
      catchError((error) => {
        console.error('Error in getTaskById:', error);
        let userMessage = 'Erreur lors du chargement de la tâche';

        if (error.status === 401) {
          return this.handle401Error(() => this.getTaskById(taskId));
        } else if (error.status === 404) {
          userMessage = 'Tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  updateTask(taskId: number, task: UpdateTask): Observable<TaskWithDetails> {
    if (!taskId || taskId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de tâche invalide'
      }));
    }

    console.log('Updating task with data:', task);
    const payload = this.formatTaskPayload(task);

    return this.http.put<TaskWithDetails>(`${this.apiUrl}${taskId}/`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Task updated successfully:', response)),
      catchError((error) => {
        console.error('Error in updateTask:', error);
        let userMessage = 'Erreur lors de la mise à jour de la tâche';

        if (error.status === 400 && error.error) {
          const validationErrors = this.formatValidationErrors(error.error);
          userMessage = `Erreur de validation : ${validationErrors}`;
        } else if (error.status === 401) {
          return this.handle401Error(() => this.updateTask(taskId, task));
        } else if (error.status === 403) {
          userMessage = 'Vous n\'avez pas les permissions pour modifier cette tâche';
        } else if (error.status === 404) {
          userMessage = 'Tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  deleteTask(taskId: number): Observable<void> {
    if (!taskId || taskId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de tâche invalide'
      }));
    }

    return this.http.delete<void>(`${this.apiUrl}${taskId}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('Task deleted successfully')),
      catchError((error) => {
        console.error('Error in deleteTask:', error);
        let userMessage = 'Erreur lors de la suppression de la tâche';

        if (error.status === 401) {
          return this.handle401Error(() => this.deleteTask(taskId));
        } else if (error.status === 403) {
          userMessage = 'Vous n\'avez pas les permissions pour supprimer cette tâche';
        } else if (error.status === 404) {
          userMessage = 'Tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  // Actions spécifiques pour les tâches
  updateTaskStatus(taskId: number, status: string): Observable<any> {
    const payload = { status };
    return this.http.patch(`${this.apiUrl}${taskId}/update_status/`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error updating task status:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.updateTaskStatus(taskId, status));
        }
        return throwError(() => error);
      })
    );
  }

  assignEmployeesToTask(taskId: number, employeeIds: number[]): Observable<any> {
    const payload = { employee_ids: employeeIds };
    return this.http.post(`${this.apiUrl}${taskId}/assign_employees/`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error assigning employees to task:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.assignEmployeesToTask(taskId, employeeIds));
        }
        return throwError(() => error);
      })
    );
  }

  // Méthodes pour les sous-tâches
  getSubtasks(filters?: { task?: number; completed?: string; employee?: number }): Observable<SubTask[]> {
    let params = new HttpParams();
    if (filters?.task) params = params.set('task', String(filters.task));
    if (filters?.completed) params = params.set('completed', String(filters.completed));
    if (filters?.employee) params = params.set('employee', String(filters.employee));

    return this.http.get<SubTask[]>(this.subtaskApiUrl, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      tap(response => console.log(`Found ${response.length} subtasks`)),
      catchError((error) => {
        console.error('Error in getSubtasks:', error);
        let userMessage = 'Erreur lors du chargement des sous-tâches';

        if (error.status === 401) {
          return this.handle401Error(() => this.getSubtasks(filters));
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  getSubtasksByTask(taskId: number): Observable<SubTask[]> {
    return this.getSubtasks({ task: taskId });
  }

  getMySubtasks(): Observable<SubTask[]> {
    return this.http.get<SubTask[]>(`${this.subtaskApiUrl}my-subtasks/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error in getMySubtasks:', error);
        let userMessage = 'Erreur lors du chargement des sous-tâches';

        if (error.status === 401) {
          return this.handle401Error(() => this.getMySubtasks());
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  updateSubtaskStatus(subtaskId: number, isCompleted: boolean): Observable<SubTask> {
    return this.http.patch<SubTask>(`${this.subtaskApiUrl}${subtaskId}/`, {
      is_completed: isCompleted
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error updating subtask status:', error);
        let userMessage = 'Erreur lors de la mise à jour de la sous-tâche';

        if (error.status === 401) {
          return this.handle401Error(() => this.updateSubtaskStatus(subtaskId, isCompleted));
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  createSubtask(subtask: any): Observable<SubTask> {
    console.log('Creating subtask with payload:', subtask);

    if (!subtask.task) {
      return throwError(() => ({
        status: 400,
        error: { task: ['La tâche est requise'] },
        userMessage: 'La tâche est requise pour créer une sous-tâche'
      }));
    }

    return this.http.post<SubTask>(this.subtaskApiUrl, subtask, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Subtask created successfully:', response)),
      catchError((error) => {
        console.error('Error in createSubtask:', error);
        let userMessage = 'Erreur lors de la création de la sous-tâche';

        if (error.status === 400 && error.error) {
          const validationErrors = this.formatValidationErrors(error.error);
          userMessage = `Erreur de validation : ${validationErrors}`;
        } else if (error.status === 401) {
          return this.handle401Error(() => this.createSubtask(subtask));
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  updateSubtask(subtaskId: number, subtask: any): Observable<SubTask> {
    if (!subtaskId || subtaskId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de sous-tâche invalide'
      }));
    }

    // Use PATCH to avoid requiring all fields (e.g., task)
    return this.http.patch<SubTask>(`${this.subtaskApiUrl}${subtaskId}/`, subtask, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Subtask updated successfully:', response)),
      catchError((error) => {
        console.error('Error in updateSubtask:', error);
        let userMessage = 'Erreur lors de la mise à jour de la sous-tâche';

        if (error.status === 400 && error.error) {
          const validationErrors = this.formatValidationErrors(error.error);
          userMessage = `Erreur de validation : ${validationErrors}`;
        } else if (error.status === 401) {
          return this.handle401Error(() => this.updateSubtask(subtaskId, subtask));
        } else if (error.status === 404) {
          userMessage = 'Sous-tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  deleteSubtask(subtaskId: number): Observable<void> {
    if (!subtaskId || subtaskId <= 0) {
      return throwError(() => ({
        status: 400,
        userMessage: 'ID de sous-tâche invalide'
      }));
    }

    return this.http.delete<void>(`${this.subtaskApiUrl}${subtaskId}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('Subtask deleted successfully')),
      catchError((error) => {
        console.error('Error in deleteSubtask:', error);
        let userMessage = 'Erreur lors de la suppression de la sous-tâche';

        if (error.status === 401) {
          return this.handle401Error(() => this.deleteSubtask(subtaskId));
        } else if (error.status === 404) {
          userMessage = 'Sous-tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  assignEmployeesToSubtask(subtaskId: number, employeeIds: number[]): Observable<SubTask> {
    const payload = { employee_ids: employeeIds };
    return this.http.post<SubTask>(`${this.subtaskApiUrl}${subtaskId}/assign_employees/`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Employees assigned to subtask successfully:', response)),
      catchError((error) => {
        console.error('Error assigning employees to subtask:', error);
        let userMessage = 'Erreur lors de l\'assignation des employés à la sous-tâche';

        if (error.status === 401) {
          return this.handle401Error(() => this.assignEmployeesToSubtask(subtaskId, employeeIds));
        } else if (error.status === 404) {
          userMessage = 'Sous-tâche non trouvée';
        }

        return throwError(() => ({
          ...error,
          userMessage
        }));
      })
    );
  }

  markSubtaskCompleted(subtaskId: number): Observable<any> {
    // Utiliser l'endpoint Projects: /api/subtasks/{id}/mark_completed/
    return this.http.post(`${this.subtaskApiUrl}${subtaskId}/mark_completed/`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error marking subtask as completed:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.markSubtaskCompleted(subtaskId));
        } else if (error.status === 403) {
          const userMessage = "Permissions insuffisantes pour marquer cette sous-tâche comme terminée";
          return throwError(() => ({ ...error, userMessage }));
        }
        return throwError(() => error);
      })
    );
  }

  markSubtaskUncompleted(subtaskId: number): Observable<any> {
    // Utiliser l'endpoint Projects: /api/subtasks/{id}/mark_uncompleted/
    return this.http.post(`${this.subtaskApiUrl}${subtaskId}/mark_uncompleted/`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error marking subtask as uncompleted:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.markSubtaskUncompleted(subtaskId));
        } else if (error.status === 403) {
          const userMessage = "Permissions insuffisantes pour modifier cette sous-tâche";
          return throwError(() => ({ ...error, userMessage }));
        }
        return throwError(() => error);
      })
    );
  }

  // Méthode pour récupérer les sous-tâches terminées par les employés
  getEmployeeCompletedSubtasks(): Observable<SubTask[]> {
    return this.http.get<SubTask[]>(`${this.subtaskApiUrl}my-subtasks/?completed=true`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Found ${response.length} completed subtasks by employees`)),
      catchError((error: any) => {
        console.error('Error fetching employee completed subtasks:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.getEmployeeCompletedSubtasks());
        }
        return throwError(() => error);
      })
    );
  }

  // Méthode pour récupérer toutes les sous-tâches avec leur statut actuel
  getAllSubtasksWithStatus(): Observable<SubTask[]> {
    return this.http.get<SubTask[]>(`${this.subtaskApiUrl}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log(`Retrieved ${response.length} subtasks with current status`)),
      catchError((error: any) => {
        console.error('Error fetching all subtasks with status:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.getAllSubtasksWithStatus());
        }
        return throwError(() => error);
      })
    );
  }

  // Méthodes utilitaires privées
  private formatValidationErrors(errors: any): string {
    if (typeof errors === 'string') {
      return errors;
    }

    return Object.entries(errors)
      .map(([field, messages]) => {
        const fieldName = this.getFieldDisplayName(field);
        if (Array.isArray(messages)) {
          return `${fieldName}: ${messages.join(', ')}`;
        } else {
          return `${fieldName}: ${messages}`;
        }
      })
      .join('; ');
  }

  private getFieldDisplayName(field: string): string {
    const fieldNames: { [key: string]: string } = {
      'title': 'Titre',
      'description': 'Description',
      'project': 'Projet',
      'status': 'Statut',
      'priority': 'Priorité',
      'start_date': 'Date de début',
      'end_date': 'Date de fin',
      'assigned_employee_ids': 'Employés assignés',
      'task': 'Tâche',
      'section_name': 'Nom de section',
      'section_number': 'Numéro de section',
      'section_id': 'ID de section',
      'kilometrage': 'Kilométrage'
    };

    return fieldNames[field] || field;
  }

  private handle401Error<T>(retryRequest: () => Observable<T>): Observable<T> {
    return this.authService.refreshToken().pipe(
      switchMap((success: boolean) => {
        if (success) {
          return retryRequest();
        } else {
          throw new Error('Token refresh failed');
        }
      }),
      catchError((refreshError) => {
        console.error('Token refresh failed:', refreshError);
        this.authService.logout();
        return throwError(() => ({
          ...refreshError,
          userMessage: 'Session expirée, veuillez vous reconnecter'
        }));
      })
    );
  }
}
