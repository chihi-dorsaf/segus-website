import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interfaces pour le système de gamification
export interface DailyObjective {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  target_subtasks: number;
  target_hours: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface SubTask {
  id: number;
  employee: number;
  employee_name: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_date: string;
  completed_date?: string;
  estimated_duration?: string;
  actual_duration?: string;
  created_by: number;
  created_by_name: string;
  is_completed: boolean;
}

export interface DailyPerformance {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  objective?: DailyObjective;
  completed_subtasks: number;
  worked_hours: number;
  overtime_hours: number;
  subtasks_goal_achieved: boolean;
  hours_goal_achieved: boolean;
  all_goals_achieved: boolean;
  daily_stars_earned: number;
  bonus_points: number;
}

export interface MonthlyPerformance {
  id: number;
  employee: number;
  employee_name: string;
  year: number;
  month: number;
  total_worked_hours: number;
  total_overtime_hours: number;
  total_completed_subtasks: number;
  days_with_all_goals: number;
  regularity_stars: number;
  overtime_bonus_stars: number;
  total_monthly_stars: number;
  total_monthly_points: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  badge_type: 'performance' | 'regularity' | 'overtime' | 'prestige' | 'special';
  icon: string;
  color: string;
  required_stars: number;
  required_points: number;
  required_months: number;
  salary_increase_percentage: number;
  is_active: boolean;
}

export interface EmployeeBadge {
  id: number;
  employee: number;
  employee_name: string;
  badge: Badge;
  earned_date: string;
  stars_at_earning: number;
  points_at_earning: number;
}

export interface EmployeeStats {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_matricule: string;
  total_stars: number;
  total_points: number;
  total_badges: number;
  total_completed_subtasks: number;
  total_worked_hours: number;
  total_overtime_hours: number;
  current_rank: number;
  current_level: string;
  total_salary_increase: number;
  badges: EmployeeBadge[];
}

export interface GamificationDashboard {
  employee_info: EmployeeStats;
  current_month_performance?: MonthlyPerformance;
  recent_daily_performances: DailyPerformance[];
  pending_subtasks: SubTask[];
  today_objective?: DailyObjective;
  leaderboard_position: number;
  next_badge?: Badge;
}

export interface Leaderboard {
  rank: number;
  employee_name: string;
  employee_email: string;
  employee_matricule: string;
  total_stars: number;
  total_points: number;
  current_level: string;
  total_badges: number;
  monthly_stars: number;
}

export interface AdminGamificationStats {
  total_employees: number;
  active_employees_today: number;
  total_objectives_today: number;
  completed_objectives_today: number;
  total_subtasks_today: number;
  completed_subtasks_today: number;
  average_daily_stars: number;
  top_performers: Leaderboard[];
  recent_badge_awards: EmployeeBadge[];
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = `${environment.apiUrl}/api/gamification`;

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

  // Daily Objectives
  getDailyObjectives(params?: any): Observable<DailyObjective[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<DailyObjective[]>(`${this.apiUrl}/daily-objectives/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    });
  }

  getTodayObjectives(): Observable<DailyObjective[]> {
    return this.http.get<DailyObjective[]>(`${this.apiUrl}/daily-objectives/today/`, {
      headers: this.getAuthHeaders()
    });
  }

  getDailyObjective(id: number): Observable<DailyObjective> {
    return this.http.get<DailyObjective>(`${this.apiUrl}/daily-objectives/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  createDailyObjective(objective: Partial<DailyObjective>): Observable<DailyObjective> {
    return this.http.post<DailyObjective>(`${this.apiUrl}/daily-objectives/`, objective, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error creating daily objective:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.createDailyObjective(objective));
        }
        return throwError(() => error);
      })
    );
  }

  bulkCreateObjectives(data: any): Observable<DailyObjective[]> {
    return this.http.post<DailyObjective[]>(`${this.apiUrl}/daily-objectives/bulk_create/`, data, {
      headers: this.getAuthHeaders()
    });
  }

  updateDailyObjective(id: number, objective: Partial<DailyObjective>): Observable<DailyObjective> {
    return this.http.patch<DailyObjective>(`${this.apiUrl}/daily-objectives/${id}/`, objective, {
      headers: this.getAuthHeaders()
    });
  }

  deleteDailyObjective(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/daily-objectives/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // SubTasks
  getSubtasks(params?: any): Observable<SubTask[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<SubTask[]>(`${this.apiUrl}/subtasks/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    }).pipe(
      catchError((error) => {
        console.error('Error fetching subtasks:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.getSubtasks(params));
        }
        return throwError(() => error);
      })
    );
  }

  getMyTasks(): Observable<SubTask[]> {
    return this.http.get<SubTask[]>(`${this.apiUrl}/subtasks/my_tasks/`, {
      headers: this.getAuthHeaders()
    });
  }

  createSubTask(subtask: Partial<SubTask>): Observable<SubTask> {
    return this.http.post<SubTask>(`${this.apiUrl}/subtasks/`, subtask, {
      headers: this.getAuthHeaders()
    });
  }

  updateSubTask(id: number, subtask: Partial<SubTask>): Observable<SubTask> {
    return this.http.patch<SubTask>(`${this.apiUrl}/subtasks/${id}/`, subtask, {
      headers: this.getAuthHeaders()
    });
  }

  completeSubTask(id: number): Observable<SubTask> {
    return this.http.post<SubTask>(`${this.apiUrl}/subtasks/${id}/complete/`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  deleteSubTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subtasks/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Daily Performance
  getDailyPerformances(params?: any): Observable<DailyPerformance[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<DailyPerformance[]>(`${this.apiUrl}/daily-performance/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    });
  }

  updateWorkingHours(data: any): Observable<DailyPerformance> {
    return this.http.post<DailyPerformance>(`${this.apiUrl}/daily-performance/update_hours/`, data, {
      headers: this.getAuthHeaders()
    });
  }

  // Monthly Performance
  getMonthlyPerformances(params?: any): Observable<MonthlyPerformance[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<MonthlyPerformance[]>(`${this.apiUrl}/monthly-performance/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    });
  }

  calculateCurrentMonth(): Observable<MonthlyPerformance[]> {
    return this.http.post<MonthlyPerformance[]>(`${this.apiUrl}/monthly-performance/calculate_current_month/`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Badges
  getBadges(params?: any): Observable<Badge[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Badge[]>(`${this.apiUrl}/badges/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    });
  }

  getBadge(id: number): Observable<Badge> {
    return this.http.get<Badge>(`${this.apiUrl}/badges/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  createBadge(badge: Partial<Badge>): Observable<Badge> {
    return this.http.post<Badge>(`${this.apiUrl}/badges/`, badge, {
      headers: this.getAuthHeaders()
    });
  }

  updateBadge(id: number, badge: Partial<Badge>): Observable<Badge> {
    return this.http.patch<Badge>(`${this.apiUrl}/badges/${id}/`, badge, {
      headers: this.getAuthHeaders()
    });
  }

  deleteBadge(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/badges/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Employee Stats
  getEmployeeStats(params?: any): Observable<EmployeeStats[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<EmployeeStats[]>(`${this.apiUrl}/employee-stats/`, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    }).pipe(
      catchError((error) => {
        console.error('Error fetching employee stats:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.getEmployeeStats(params));
        }
        return throwError(() => error);
      })
    );
  }

  getMyStats(): Observable<EmployeeStats> {
    return this.http.get<EmployeeStats>(`${this.apiUrl}/employee-stats/my_stats/`, {
      headers: this.getAuthHeaders()
    });
  }

  getLeaderboard(): Observable<Leaderboard[]> {
    return this.http.get<Leaderboard[]>(`${this.apiUrl}/employee-stats/leaderboard/`, {
      headers: this.getAuthHeaders()
    });
  }

  getDashboard(): Observable<GamificationDashboard> {
    return this.http.get<GamificationDashboard>(`${this.apiUrl}/employee-stats/dashboard/`, {
      headers: this.getAuthHeaders()
    });
  }

  getAdminStats(): Observable<AdminGamificationStats> {
    return this.http.get<AdminGamificationStats>(`${this.apiUrl}/employee-stats/admin_stats/`, {
      headers: this.getAuthHeaders()
    });
  }

  updateAllStats(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/employee-stats/update_all_stats/`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  syncProjectSubtasks(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/subtasks/sync_project_subtasks/`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error syncing project subtasks:', error);
        if (error.status === 401) {
          return this.handle401Error(() => this.syncProjectSubtasks());
        }
        return throwError(() => error);
      })
    );
  }
}