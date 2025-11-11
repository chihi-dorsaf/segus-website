import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProjectsComponent } from './admin-projects.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { ExcelExportService } from '../../services/excel-export.service';

describe('AdminProjectsComponent', () => {
  let component: AdminProjectsComponent;
  let fixture: ComponentFixture<AdminProjectsComponent>;

  beforeEach(() => {
    const projectServiceMock = {
      getProjects: () => of({ count: 0, next: null, previous: null, results: [] })
    } as unknown as ProjectService;

    const taskServiceMock = {
      getTasksByProject: () => of([]),
      assignEmployeesToTask: () => of({})
    } as unknown as TaskService;

    const employeeServiceMock = {
      getEmployees: () => of({ count: 0, results: [] })
    } as unknown as EmployeeService;

    const notificationServiceMock = {
      notify: () => {}
    } as unknown as NotificationService;

    const excelExportServiceMock = {
      exportToExcel: () => {}
    } as unknown as ExcelExportService;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AdminProjectsComponent],
      providers: [
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: EmployeeService, useValue: employeeServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: ExcelExportService, useValue: excelExportServiceMock }
      ]
    });
    fixture = TestBed.createComponent(AdminProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
