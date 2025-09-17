import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { UpdateSubTask } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeFrontofficeService {
  private apiUrl = `${environment.apiUrl}/api/projects/employee/`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}dashboard/`, {
      headers: this.getAuthHeaders()
    });
  }

  getTasks(status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any[]>(`${this.apiUrl}tasks/`, {
      params,
      headers: this.getAuthHeaders()
    });
  }

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}projects/`, {
      headers: this.getAuthHeaders()
    });
  }

  updateTaskStatus(taskId: number, status: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/api/projects/tasks/${taskId}/update_status/`, { status }, {
      headers: this.getAuthHeaders()
    });
  }

  updateSubtaskStatus(subtaskId: number, data: UpdateSubTask): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/api/projects/subtasks/${subtaskId}/`, data, {
      headers: this.getAuthHeaders()
    });
  }
}
