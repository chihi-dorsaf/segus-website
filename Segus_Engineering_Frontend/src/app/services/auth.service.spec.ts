import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, AuthResponse, User, LoginCredentials } from './auth.service';
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

    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.isAuthenticated()).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/create-with-email/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/create-with-email/`);
      req.flush({ error: 'Invalid credentials' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should store tokens with remember me', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials, true).subscribe();

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/create-with-email/`);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem('access_token')).toBe(mockAuthResponse.access);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refresh);
    });

    it('should store tokens in session storage without remember me', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials, false).subscribe();

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/create-with-email/`);
      req.flush(mockAuthResponse);

      expect(sessionStorage.getItem('access_token')).toBe(mockAuthResponse.access);
      expect(sessionStorage.getItem('refresh_token')).toBe(mockAuthResponse.refresh);
    });
  });

  describe('logout', () => {
    it('should logout user and clear tokens', () => {
      // Set up authenticated state
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('refresh_token', 'refresh');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(sessionStorage.getItem('access_token')).toBeNull();
      expect(sessionStorage.getItem('refresh_token')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/sign-in']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('access_token', 'valid-token');
      expect(service.isAuthenticated()).toBeTruthy();
    });

    it('should return false when no access token exists', () => {
      expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should check both localStorage and sessionStorage', () => {
      sessionStorage.setItem('access_token', 'session-token');
      expect(service.isAuthenticated()).toBeTruthy();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', 'local-token');
      expect(service.getToken()).toBe('local-token');
    });

    it('should return token from sessionStorage if not in localStorage', () => {
      sessionStorage.setItem('access_token', 'session-token');
      expect(service.getToken()).toBe('session-token');
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      localStorage.setItem('access_token', 'valid-token');

      service.getCurrentUser().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush(mockUser);
    });

    it('should handle error when getting current user', () => {
      localStorage.setItem('access_token', 'invalid-token');

      service.getCurrentUser().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/`);
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', () => {
      localStorage.setItem('refresh_token', 'valid-refresh-token');

      const newTokenResponse = { access: 'new-access-token' };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(newTokenResponse);
        expect(localStorage.getItem('access_token')).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/refresh/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh: 'valid-refresh-token' });
      req.flush(newTokenResponse);
    });

    it('should handle refresh token error', () => {
      localStorage.setItem('refresh_token', 'invalid-refresh-token');

      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.authUrl}/jwt/refresh/`);
      req.flush({ error: 'Token is invalid or expired' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      localStorage.setItem('access_token', 'valid-token');

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const updatedUser = { ...mockUser, ...updateData };

      service.updateProfile(updateData).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedUser);
    });
  });

  describe('changePassword', () => {
    it('should change user password', () => {
      localStorage.setItem('access_token', 'valid-token');

      const passwordData = {
        current_password: 'oldpass',
        new_password: 'newpass123'
      };

      service.changePassword(passwordData.current_password, passwordData.new_password).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.authUrl}/users/set_password/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(passwordData);
      req.flush({ message: 'Password changed successfully' });
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', () => {
      const email = 'test@example.com';

      service.requestPasswordReset(email).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.authUrl}/password-reset-code/request/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      req.flush({ message: 'Reset code sent' });
    });
  });

  describe('verifyResetCode', () => {
    it('should verify reset code', () => {
      const email = 'test@example.com';
      const code = '123456';

      service.verifyResetCode(email, code).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.authUrl}/password-reset-code/verify/`);
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

      service.confirmPasswordReset(resetData.email, resetData.code, resetData.new_password).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.authUrl}/password-reset-code/confirm/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(resetData);
      req.flush({ message: 'Password reset successfully' });
    });
  });

  describe('hasRole', () => {
    it('should return true for correct role', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(of(mockUser));
      
      service.hasRole('EMPLOYE').subscribe(hasRole => {
        expect(hasRole).toBeTruthy();
      });
    });

    it('should return false for incorrect role', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(of(mockUser));
      
      service.hasRole('ADMIN').subscribe(hasRole => {
        expect(hasRole).toBeFalsy();
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      spyOn(service, 'getCurrentUser').and.returnValue(of(adminUser));
      
      service.isAdmin().subscribe(isAdmin => {
        expect(isAdmin).toBeTruthy();
      });
    });

    it('should return false for non-admin user', () => {
      spyOn(service, 'getCurrentUser').and.returnValue(of(mockUser));
      
      service.isAdmin().subscribe(isAdmin => {
        expect(isAdmin).toBeFalsy();
      });
    });
  });
});
