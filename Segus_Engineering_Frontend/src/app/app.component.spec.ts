import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component', () => {
    expect(component).toBeDefined();
  });

  it('should handle authentication check', () => {
    authService.isAuthenticated.and.returnValue(true);
    
    const isAuth = authService.isAuthenticated();
    expect(isAuth).toBeTruthy();
    expect(authService.isAuthenticated).toHaveBeenCalled();
  });

  it('should handle user logout', () => {
    authService.logout.and.stub();
    
    authService.logout();
    expect(authService.logout).toHaveBeenCalled();
  });
});
