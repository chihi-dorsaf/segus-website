import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, AuthResponse, User, LoginCredentials } from './auth.service';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'EMPLOYE',
    first_name: 'Test',
    last_name: 'User',
    is_active: true
  };

  const mockAuthResponse: AuthResponse = {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token'
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  function makeValidJwt(expiresInSeconds: number = 3600): string {
    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const payloadObj = { exp: Math.floor(Date.now() / 1000) + expiresInSeconds } as any;
    const payload = btoa(JSON.stringify(payloadObj));
    return `${header}.${payload}.signature`;
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials.email, credentials.password).subscribe(response => {
        expect(response).toEqual(jasmine.objectContaining({ access: jasmine.any(String), refresh: jasmine.any(String) }));
        expect(service.isAuthenticated()).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/create-with-email/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush({ access: makeValidJwt(), refresh: 'mock-refresh-token' } as AuthResponse);

      // loadUserProfile GET triggered after storing tokens
      const me = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      me.flush(mockUser);
    });

    it('should handle login error', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(credentials.email, credentials.password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/create-with-email/`);
      req.flush({ error: 'Invalid credentials' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should store tokens with remember me', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials.email, credentials.password, true).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/create-with-email/`);
      req.flush({ access: makeValidJwt(), refresh: 'mock-refresh-token' } as AuthResponse);

      // loadUserProfile GET
      const me = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      me.flush(mockUser);

      expect(localStorage.getItem('auth_token')).toBeTruthy();
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });

    it('should store tokens in session storage without remember me', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials.email, credentials.password, false).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/create-with-email/`);
      req.flush({ access: makeValidJwt(), refresh: 'mock-refresh-token' } as AuthResponse);

      // loadUserProfile GET
      const me = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      me.flush(mockUser);

      expect(sessionStorage.getItem('auth_token')).toBeTruthy();
      expect(sessionStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });
  });

  describe('logout', () => {
    it('should logout user and clear tokens', () => {
      localStorage.setItem('auth_token', makeValidJwt());
      localStorage.setItem('refresh_token', 'refresh');

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(sessionStorage.getItem('auth_token')).toBeNull();
      expect(sessionStorage.getItem('refresh_token')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('auth_token', makeValidJwt());
      expect(service.isAuthenticated()).toBeTruthy();
    });

    it('should return false when no access token exists', () => {
      expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should check both localStorage and sessionStorage', () => {
      sessionStorage.setItem('auth_token', makeValidJwt());
      expect(service.isAuthenticated()).toBeTruthy();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const token = makeValidJwt();
      localStorage.setItem('auth_token', token);
      expect(service.getToken()).toBe(token);
    });

    it('should return token from sessionStorage if not in localStorage', () => {
      const token = makeValidJwt();
      sessionStorage.setItem('auth_token', token);
      expect(service.getToken()).toBe(token);
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const token = makeValidJwt();
      localStorage.setItem('auth_token', token);
      service.fetchCurrentUser().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
      req.flush(mockUser);
    });

    it('should handle error when getting current user', () => {
      localStorage.setItem('auth_token', makeValidJwt());

      service.fetchCurrentUser().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', () => {
      localStorage.setItem('refresh_token', 'valid-refresh-token');
      // simulate remember me OFF (default): token goes to sessionStorage
      localStorage.removeItem('remember_me');

      const newTokenResponse = { access: 'new-access-token', refresh: 'valid-refresh-token' } as AuthResponse;

      service.refreshToken().subscribe(success => {
        expect(success).toBeTrue();
        expect(sessionStorage.getItem('auth_token')).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/refresh/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh: 'valid-refresh-token' });
      req.flush(newTokenResponse);
    });

    it('should handle refresh token error', () => {
      localStorage.setItem('refresh_token', 'invalid-refresh-token');

      service.refreshToken().subscribe(success => {
        expect(success).toBeFalse();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/jwt/refresh/`);
      req.flush({ error: 'Token is invalid or expired' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      localStorage.setItem('auth_token', makeValidJwt());

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const updatedUser = { ...mockUser, ...updateData };

      service.updateProfile(updateData).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      // ensureAuthenticated triggers a GET to /api/auth/users/me/ first
      const meReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      expect(meReq.request.method).toBe('GET');
      meReq.flush(mockUser);

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedUser);
    });
  });

  describe('changePassword', () => {
    it('should change user password', () => {
      localStorage.setItem('auth_token', makeValidJwt());

      const passwordData = {
        current_password: 'oldpass',
        new_password: 'newpass123'
      };

      service.changePassword(passwordData.current_password, passwordData.new_password).subscribe(response => {
        expect(response).toBeDefined();
      });

      // ensureAuthenticated triggers a GET to /api/auth/users/me/ first
      const meReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/me/`);
      expect(meReq.request.method).toBe('GET');
      meReq.flush(mockUser);

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/users/set_password/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(passwordData);
      req.flush({ message: 'Password changed successfully' });
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', () => {
      const email = 'test@example.com';

      service.requestPasswordResetCode(email).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/password-reset/request-code/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      req.flush({ message: 'Reset code sent' });
    });
  });

  describe('verifyResetCode', () => {
    it('should verify reset code', () => {
      const email = 'test@example.com';
      const code = '123456';

      service.verifyPasswordResetCode(email, code).subscribe(response => {
        expect(response).toBeDefined();
      });

const req = httpMock.expectOne(`${environment.apiUrl}/api/users/password-reset/verify-code/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, code });
      req.flush({ message: 'Code verified' });
    });
  });

  describe('confirmPasswordReset', () => {
    it('should confirm password reset', () => {
      const resetData = {
        email: 'test@example.com',
        code: '123456',
        new_password: 'newpass123'
      };

      service.confirmPasswordResetWithCode(resetData.email, resetData.code, resetData.new_password).subscribe(response => {
        expect(response).toBeDefined();
      });

const req = httpMock.expectOne(`${environment.apiUrl}/api/users/password-reset/confirm/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(resetData);
      req.flush({ message: 'Password reset successfully' });
    });
  });

  describe('hasRole', () => {
    it('should return true for correct role', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.hasRole('EMPLOYE' as any)).toBeTrue();
    });

    it('should return false for incorrect role', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.hasRole('ADMIN' as any)).toBeFalse();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      service['currentUserSubject'].next(adminUser);
      expect(service.isAdmin()).toBeTrue();
    });

    it('should return false for non-admin user', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.isAdmin()).toBeFalse();
    });
  });
});
