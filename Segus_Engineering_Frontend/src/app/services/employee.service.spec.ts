import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';
import { environment } from '../../environments/environment';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;

  const mockEmployee = {
    id: 1,
    user: {
      id: 1,
      username: 'testemployee',
      email: 'employee@test.com',
      first_name: 'Test',
      last_name: 'Employee',
      role: 'EMPLOYE'
    },
    matricule: 'EMP-0001',
    position: 'Développeur',
    phone: '+216 12 345 678',
    salary: 2500.000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockWorkSession = {
    id: 1,
    employee: 1,
    start_time: '2024-01-01T08:00:00Z',
    end_time: null,
    status: 'active',
    total_work_time: null,
    total_pause_time: '00:00:00',
    notes: 'Test session'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmployeeService]
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Employee Management', () => {
    it('should get all employees', () => {
      const mockEmployees = [mockEmployee];

      service.getEmployees().subscribe(employees => {
        expect(employees).toEqual(mockEmployees);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployees);
    });

    it('should get employee by id', () => {
      service.getEmployee(1).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployee);
    });

    it('should create employee', () => {
      const newEmployee = { ...mockEmployee };
      delete newEmployee.id;

      service.createEmployee(newEmployee).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newEmployee);
      req.flush(mockEmployee);
    });

    it('should update employee', () => {
      const updatedEmployee = { ...mockEmployee, position: 'Senior Développeur' };

      service.updateEmployee(1, updatedEmployee).subscribe(employee => {
        expect(employee).toEqual(updatedEmployee);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedEmployee);
      req.flush(updatedEmployee);
    });

    it('should delete employee', () => {
      service.deleteEmployee(1).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Work Sessions', () => {
    it('should get work sessions', () => {
      const mockSessions = [mockWorkSession];

      service.getWorkSessions().subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });

    it('should start work session', () => {
      service.startWorkSession(1).subscribe(session => {
        expect(session).toEqual(mockWorkSession);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ employee: 1 });
      req.flush(mockWorkSession);
    });

    it('should pause work session', () => {
      const pausedSession = { ...mockWorkSession, status: 'paused' };

      service.pauseWorkSession(1).subscribe(session => {
        expect(session).toEqual(pausedSession);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/1/pause/`);
      expect(req.request.method).toBe('POST');
      req.flush(pausedSession);
    });

    it('should resume work session', () => {
      service.resumeWorkSession(1).subscribe(session => {
        expect(session).toEqual(mockWorkSession);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/1/resume/`);
      expect(req.request.method).toBe('POST');
      req.flush(mockWorkSession);
    });

    it('should end work session', () => {
      const endedSession = { 
        ...mockWorkSession, 
        status: 'completed',
        end_time: '2024-01-01T17:00:00Z',
        total_work_time: '08:00:00'
      };

      service.endWorkSession(1).subscribe(session => {
        expect(session).toEqual(endedSession);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/1/end/`);
      expect(req.request.method).toBe('POST');
      req.flush(endedSession);
    });

    it('should get current work session', () => {
      service.getCurrentWorkSession().subscribe(session => {
        expect(session).toEqual(mockWorkSession);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/current/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockWorkSession);
    });
  });

  describe('Statistics', () => {
    it('should get employee statistics', () => {
      const mockStats = {
        total_work_hours: 160,
        total_sessions: 20,
        average_session_duration: '08:00:00',
        completed_tasks: 45
      };

      service.getEmployeeStatistics(1).subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/1/statistics/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });

    it('should get work session statistics', () => {
      const mockStats = {
        total_sessions: 100,
        total_work_time: '800:00:00',
        average_session_duration: '08:00:00'
      };

      service.getWorkSessionStatistics().subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/work-sessions/statistics/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', () => {
      service.getEmployees().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/employees/`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
