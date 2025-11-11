import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDashboardComponent } from './project-dashboard.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';

describe('ProjectDashboardComponent', () => {
  let component: ProjectDashboardComponent;
  let fixture: ComponentFixture<ProjectDashboardComponent>;

  beforeEach(() => {
    const authMock = {
      getToken: () => 'test-token',
      getCurrentUser: () => ({ id: 1, username: 'testuser', role: 'EMPLOYE' }),
      fetchCurrentUser: () => of({ id: 1, username: 'testuser', role: 'EMPLOYE' })
    } as unknown as AuthService;

    const projectServiceMock = {
      getProjects: () => of({ count: 0, next: null, previous: null, results: [] })
    } as unknown as ProjectService;

    const taskServiceMock = {
      getTasksByProject: () => of([])
    } as unknown as TaskService;

    const employeeServiceMock = {
      getEmployeesForProjects: () => of([])
    } as unknown as EmployeeService;
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, ProjectDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: EmployeeService, useValue: employeeServiceMock }
      ]
    });
    fixture = TestBed.createComponent(ProjectDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
