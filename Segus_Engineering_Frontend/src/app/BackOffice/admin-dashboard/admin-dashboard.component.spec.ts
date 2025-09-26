import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

// Mocks minimalistes pour éviter des appels HTTP réels
const mockEmployeeService = { getEmployees: () => of({ results: [] }) } as any;
const mockProjectService = { getProjects: () => of({ results: [] }) } as any;
const mockTaskService = { getTasks: () => of([]) } as any;
const mockJobService = { getJobStats: () => of({}) } as any;
const mockSocketService = {
  getWorkSessionUpdates: () => of(null),
  getAdminStatsUpdates: () => of(null),
  requestStatsUpdate: () => {}
} as any;
const mockWorkHoursService = {} as any;

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, AdminDashboardComponent],
      providers: [
        { provide: (window as any).EmployeeService || 'EmployeeService', useValue: mockEmployeeService },
        { provide: (window as any).ProjectService || 'ProjectService', useValue: mockProjectService },
        { provide: (window as any).TaskService || 'TaskService', useValue: mockTaskService },
        { provide: (window as any).JobService || 'JobService', useValue: mockJobService },
        { provide: (window as any).SocketService || 'SocketService', useValue: mockSocketService },
        { provide: (window as any).EmployeeWorkHoursService || 'EmployeeWorkHoursService', useValue: mockWorkHoursService }
      ]
    });
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
