
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserSimple, ApiErrorResponse } from '../models/employee.model';
import { environment } from '../../environments/environment';
import { AuthService, RegisterData, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/auth/users/`; // Added trailing slash

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Delegate user creation to AuthService
  createUser(user: {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    matricule: string;
    position: string;
  }): Observable<User> {
    console.log('Creating user:', user);
    return this.authService.register(user).pipe(
      tap(user => console.log('✅ [UserService] User created:', user)),
      catchError(error => {
        console.error('❌ [UserService] Error creating user:', JSON.stringify(error, null, 2));
        let errorMessage = 'Failed to create user';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.detail) {
            errorMessage = error.error.detail;
          } else {
            const errors = Object.keys(error.error).map(key =>
              `${key}: ${Array.isArray(error.error[key]) ? error.error[key].join(', ') : error.error[key]}`
            );
            errorMessage = errors.join('; ');
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Récupérer l'utilisateur connecté
  getCurrentUser(): Observable<UserSimple> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserSimple>(`${this.apiUrl}me/`, { headers }).pipe(
      tap(user => console.log('✅ [UserService] Current user fetched:', user)),
      catchError(error => {
        console.error('❌ [UserService] Error fetching current user:', JSON.stringify(error, null, 2));
        return throwError(() => new Error('Failed to fetch current user: ' + error.message));
      })
    );
  }

  // Récupérer un utilisateur par ID
  getUser(userId: number): Observable<UserSimple> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserSimple>(`${this.apiUrl}${userId}/`, { headers }).pipe(
      tap(user => console.log('✅ [UserService] User fetched:', user)),
      catchError(error => {
        console.error('❌ [UserService] Error fetching user:', JSON.stringify(error, null, 2));
        return throwError(() => new Error(`Failed to fetch user ${userId}: ` + error.message));
      })
    );
  }

  // Mettre à jour un utilisateur
  updateUser(id: number, user: Partial<UserSimple>): Observable<UserSimple> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<UserSimple>(`${this.apiUrl}${id}/`, user, { headers }).pipe(
      tap(user => console.log('✅ [UserService] User updated:', user)),
      catchError(error => {
        console.error('❌ [UserService] Error updating user:', JSON.stringify(error, null, 2));
        return throwError(() => new Error(`Failed to update user ${id}: ` + error.message));
      })
    );
  }

  // Supprimer un utilisateur
  deleteUser(id: number): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers }).pipe(
      tap(() => console.log('✅ [UserService] User deleted:', id)),
      catchError(error => {
        console.error('❌ [UserService] Error deleting user:', JSON.stringify(error, null, 2));
        return throwError(() => new Error(`Failed to delete user ${id}: ` + error.message));
      })
    );
  }

  // Réinitialiser le mot de passe d'un utilisateur
  resetUserPassword(userId: number): Observable<{ temporary_password: string }> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ temporary_password: string }>(`${this.apiUrl}${userId}/reset_password/`, {}, { headers }).pipe(
      tap(response => console.log('✅ [UserService] Password reset:', response)),
      catchError(error => {
        console.error('❌ [UserService] Error resetting password:', JSON.stringify(error, null, 2));
        return throwError(() => new Error(`Failed to reset password for user ${userId}: ` + error.message));
      })
    );
  }
}

