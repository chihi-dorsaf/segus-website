import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { UserRole } from '../models/project.model';

export interface AuthResponse {
  refresh: string;
  access: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  position?: string;
  department?: string;
  bio?: string;
  profile_photo?: string;
  created_at?: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  matricule: string;
  position: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth/`;
  private usersApiUrl = `${environment.apiUrl}/api/users/`;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private rememberMeKey = 'remember_me';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('AuthService initialized with API URL:', this.apiUrl);
    this.checkCurrentUser();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ [AuthService] No authentication token available');
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getBasicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    console.log('🔐 [AuthService] Attempting login for:', email, 'Remember me:', rememberMe);
    const credentials: LoginCredentials = { email, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}jwt/create-with-email/`, credentials).pipe(
      tap(response => {
        console.log('✅ [AuthService] Login response:', response);
        if (response.access) {
          this.storeTokens(response.access, response.refresh, rememberMe);
          console.log('✅ [AuthService] Tokens stored successfully');
          this.loadUserProfile();
        }
      }),
      catchError(error => {
        console.error('❌ [AuthService] Login error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        let errorMessage = 'Échec de la connexion';
        if (error.status === 401) {
          errorMessage = 'Identifiants incorrects.';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        return throwError(() => ({
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  register(userData: RegisterData): Observable<User> {
    console.log('📝 [AuthService] Registering user:', userData);
    return this.http.post<User>(`${this.apiUrl}users/`, userData).pipe(
      tap(user => console.log('✅ [AuthService] User registered:', user)),
      catchError(error => {
        console.error('❌ [AuthService] Registration error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        let errorMessage = 'Échec de l\'inscription';
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
        return throwError(() => ({
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  getUserProfile(): Observable<User> {
    console.log('🔍 [AuthService] Fetching user profile');
    const token = this.getToken();
    console.log('🔍 [AuthService] Token exists:', !!token);
    if (!token) {
      return throwError(() => ({ message: 'No token available', status: 401 }));
    }
    return this.http.get<User>(`${environment.apiUrl}/api/auth/users/me/`, { headers: this.getAuthHeaders() }).pipe(
      tap(user => {
        console.log('✅ [AuthService] User profile loaded:', user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error fetching user profile:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        let errorMessage = 'Échec de la récupération du profil utilisateur';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          this.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'Accès refusé. Vérifiez vos permissions.';
        } else if (error.status === 404) {
          errorMessage = 'Endpoint utilisateur non trouvé.';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        }
        return throwError(() => ({
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  ensureAuthenticated(): Observable<void> {
    console.log('🔐 [AuthService] Ensuring authentication');
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ [AuthService] No token available');
      this.logout();
      this.router.navigate(['/login']);
      return throwError(() => ({ message: 'No token available', status: 401 }));
    }
    if (this.isTokenExpired(token)) {
      console.log('🔄 [AuthService] Token expired, attempting refresh');
      return this.refreshToken().pipe(
        switchMap(() => of(void 0)),
        catchError(error => {
          console.error('❌ [AuthService] Token refresh failed:', error);
          this.logout();
          this.router.navigate(['/login']);
          return throwError(() => ({
            message: 'Failed to refresh token',
            status: error.status || 401,
            error: error.error
          }));
        })
      );
    }
    return this.getUserProfile().pipe(
      switchMap(() => of(void 0)),
      catchError(error => {
        console.error('❌ [AuthService] Error verifying user profile:', error);
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => of(void 0)),
            catchError(refreshError => {
              console.error('❌ [AuthService] Token refresh failed after profile error:', refreshError);
              this.logout();
              this.router.navigate(['/login']);
              return throwError(() => ({
                message: 'Failed to refresh token',
                status: refreshError.status || 401,
                error: refreshError.error
              }));
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    console.log('🔒 [AuthService] Logging out');
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = this.getStoredToken();
    if (!token) {
      console.log('🔑 [AuthService] No token found in storage');
      return null;
    }

    // Vérifier si le token est expiré (basique)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir en millisecondes
      if (Date.now() >= exp) {
        console.warn('⚠️ [AuthService] Token expired, removing from storage');
        this.logout();
        return null;
      }
      console.log('🔑 [AuthService] Token is valid, expires at:', new Date(exp));
      return token;
    } catch (error) {
      console.error('❌ [AuthService] Error parsing token:', error);
      this.logout();
      return null;
    }
  }

  isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  refreshTokenIfNeeded(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();

      // Si le token expire dans les 5 prochaines minutes, le rafraîchir
      if (exp - now < 5 * 60 * 1000) {
        console.log('🔄 [AuthService] Token expires soon, attempting refresh');
        return this.refreshToken();
      }

      return of(true);
    } catch (error) {
      console.error('❌ [AuthService] Error checking token expiration:', error);
      return of(false);
    }
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      console.warn('⚠️ [AuthService] No refresh token available');
      return of(false);
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}jwt/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        if (response.access) {
          const rememberMe = this.isRememberMeEnabled();
          this.storeToken(response.access, rememberMe);
          console.log('✅ [AuthService] Token refreshed successfully');
        }
      }),
      map(response => !!response.access),
      catchError(error => {
        console.error('❌ [AuthService] Token refresh failed:', error);
        this.logout();
        return of(false);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isValid = !!token;
    console.log('🔐 [AuthService] isAuthenticated:', isValid);
    return isValid;
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    console.log('👤 [AuthService] getCurrentUser:', user ? user.username : 'null');
    return user;
  }

  fetchCurrentUser(): Observable<User> {
    console.log('🔍 [AuthService] fetchCurrentUser called');
    return this.getUserProfile();
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      console.log('⚠️ [AuthService] No user, cannot check role');
      return false;
    }
    const hasRole = user.role.toUpperCase() === role;
    console.log(`🔐 [AuthService] hasRole(${role}):`, hasRole);
    return hasRole;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isEmployee(): boolean {
    return this.hasRole(UserRole.EMPLOYE);
  }

  updateProfile(data: any): Observable<User> {
    console.log('✏️ [AuthService] Updating profile:', data);
    return this.ensureAuthenticated().pipe(
      switchMap(() => {
        // En cas de FormData, ne pas fixer Content-Type
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const headers = isFormData ? this.getAuthHeaders().delete('Content-Type') : this.getAuthHeaders();
        return this.http.patch<User>(`${environment.apiUrl}/api/auth/users/me/`, data, { headers }).pipe(
          tap(user => {
            console.log('✅ [AuthService] Profile updated:', user);
            this.currentUserSubject.next(user);
          }),
          catchError(error => {
            console.error('❌ [AuthService] Update profile error:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            return throwError(() => ({
              message: 'Failed to update profile',
              status: error.status,
              error: error.error
            }));
          })
        );
      }),
      catchError(error => {
        console.error('❌ [AuthService] Authentication error during profile update:', error);
        return throwError(() => error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    console.log('🔑 [AuthService] Changing password');
    return this.ensureAuthenticated().pipe(
      switchMap(() => {
        return this.http.post(`${this.apiUrl}users/set_password/`, {
          current_password: currentPassword,
          new_password: newPassword
        }, { headers: this.getAuthHeaders() }).pipe(
          tap(() => console.log('✅ [AuthService] Password changed successfully')),
          catchError(error => {
            console.error('❌ [AuthService] Change password error:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            return throwError(() => ({
              message: 'Failed to change password',
              status: error.status,
              error: error.error
            }));
          })
        );
      }),
      catchError(error => {
        console.error('❌ [AuthService] Authentication error during password change:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    console.log('🔄 [AuthService] Requesting forgot password for:', email);
    return this.http.post(`${this.apiUrl}users/reset_password/`, { email }, { headers: this.getBasicHeaders() }).pipe(
      tap(response => console.log('✅ [AuthService] Password reset response:', response)),
      catchError(error => {
        console.error('❌ [AuthService] Password reset error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => ({
          message: 'Password reset failed: ' + (error.error?.detail || error.message),
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  // --- Password reset by code (custom flow) ---
  requestPasswordResetCode(email: string): Observable<any> {
    console.log('🔄 [AuthService] Requesting reset code for:', email);
    console.log('🔄 [AuthService] Using URL:', `${this.usersApiUrl}password-reset/request-code/`);
    return this.http.post(`${this.usersApiUrl}password-reset/request-code/`, { email }, { headers: this.getBasicHeaders() }).pipe(
      tap(() => console.log('✅ [AuthService] Reset code requested')),
      catchError(error => {
        console.error('❌ [AuthService] Request reset code error:', error);
        console.error('❌ [AuthService] Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        return throwError(() => ({ message: 'Failed to request reset code', status: error.status, error: error.error }));
      })
    );
  }

  verifyPasswordResetCode(email: string, code: string): Observable<any> {
    return this.http.post(`${this.usersApiUrl}password-reset/verify-code/`, { email, code }, { headers: this.getBasicHeaders() }).pipe(
      tap(() => console.log('✅ [AuthService] Reset code verified')),
      catchError(error => {
        console.error('❌ [AuthService] Verify reset code error:', error);
        return throwError(() => ({ message: 'Invalid or expired code', status: error.status, error: error.error }));
      })
    );
  }

  confirmPasswordResetWithCode(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.usersApiUrl}password-reset/confirm/`, { email, code, new_password: newPassword }, { headers: this.getBasicHeaders() }).pipe(
      tap(() => console.log('✅ [AuthService] Password reset via code confirmed')),
      catchError(error => {
        console.error('❌ [AuthService] Confirm reset via code error:', error);
        return throwError(() => ({ message: 'Failed to reset password', status: error.status, error: error.error }));
      })
    );
  }
  confirmResetPassword(uid: string, token: string, newPassword: string): Observable<any> {
    console.log('🔄 [AuthService] Confirming password reset');
    return this.http.post(`${this.apiUrl}users/reset_password_confirm/`, {
      uid,
      token,
      new_password: newPassword
    }).pipe(
      tap(response => console.log('✅ [AuthService] Password reset confirmed')),
      catchError(error => {
        console.error('❌ [AuthService] Confirm reset password error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => ({
          message: 'Failed to confirm password reset',
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  private checkCurrentUser(): void {
    console.log('🔍 [AuthService] Checking current user');
    if (this.isAuthenticated()) {
      this.loadUserProfile();
    } else {
      console.log('⚠️ [AuthService] No valid token, user not authenticated');
      this.currentUserSubject.next(null);
    }
  }

  private loadUserProfile(): void {
    console.log('🔍 [AuthService] Loading user profile');
    this.getUserProfile().subscribe({
      next: user => {
        console.log('✅ [AuthService] Profil utilisateur chargé:', user);
      },
      error: error => {
        console.error('❌ [AuthService] Erreur lors du chargement du profil:', error);
        this.logout();
      }
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp < Date.now() / 1000;
      console.log('🔐 [AuthService] isTokenExpired:', isExpired);
      return isExpired;
    } catch {
      console.log('⚠️ [AuthService] Token parsing failed, assuming expired');
      return true;
    }
  }

  private storeTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.tokenKey, accessToken);
    storage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.rememberMeKey, rememberMe.toString());
    console.log('🔑 [AuthService] Tokens stored in:', rememberMe ? 'localStorage' : 'sessionStorage');
  }

  private storeToken(accessToken: string, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.tokenKey, accessToken);
    console.log('🔑 [AuthService] Access token stored in:', rememberMe ? 'localStorage' : 'sessionStorage');
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey) || sessionStorage.getItem(this.refreshTokenKey);
  }

  private isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.rememberMeKey) === 'true';
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.rememberMeKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    console.log('🔒 [AuthService] All tokens cleared from storage');
  }
}
