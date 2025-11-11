import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { EmployeeWorkHoursComponent } from './employee-work-hours.component';
import { EmployeeWorkHoursService } from '../../services/employee-work-hours.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('EmployeeWorkHoursComponent', () => {
  let component: EmployeeWorkHoursComponent;
  let fixture: ComponentFixture<EmployeeWorkHoursComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EmployeeWorkHoursComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        EmployeeWorkHoursService,
        AuthService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeWorkHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Flush initial HTTP requests triggered in ngOnInit
    httpMock = TestBed.inject(HttpTestingController);

    // 1) GET sessions
    const sessionsReq = httpMock.expectOne(`${environment.apiUrl}/api/employees/work-sessions`);
    expect(sessionsReq.request.method).toBe('GET');
    sessionsReq.flush([]);

    // 2) GET current session
    const currentReq = httpMock.expectOne(`${environment.apiUrl}/api/employees/work-sessions/current/`);
    expect(currentReq.request.method).toBe('GET');
    currentReq.flush(null);

    // 3) GET employee work stats
    const statsReq = httpMock.expectOne(`${environment.apiUrl}/api/employees/work-stats/employee-stats/`);
    expect(statsReq.request.method).toBe('GET');
    statsReq.flush([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.sessionForm).toBeTruthy();
    expect(component.pauseForm).toBeTruthy();
    expect(component.sessions).toBeDefined();
    expect(Array.isArray(component.sessions)).toBeTrue();
  });

  it('should have valid forms', () => {
    expect(component.sessionForm).toBeTruthy();
    expect(component.pauseForm).toBeTruthy();
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });
});









