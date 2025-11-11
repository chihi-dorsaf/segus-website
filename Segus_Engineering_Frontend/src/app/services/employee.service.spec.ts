import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService, CreateEmployeeRequest, UpdateEmployeeRequest, Employee } from './employee.service';
import { environment } from '../../environments/environment';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;

  const mockEmployee: Employee = {
    id: 1,
    matricule: 'EMP-0001',
    position: 'Développeur',
    phone: '+216 12 345 678',
    salary: 2500.0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    full_name: 'Test Employee',
    email: 'employee@test.com',
    user_details: {
      id: 1,
      username: 'testemployee',
      email: 'employee@test.com',
      first_name: 'Test',
      last_name: 'Employee',
      role: 'EMPLOYE',
      is_active: true
    }
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
    it('should get all employees (paginated)', () => {
      const mockResponse = { count: 1, results: [mockEmployee] };

      service.getEmployees().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get employee by id', () => {
      service.getEmployee(1).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployee);
    });

    it('should create employee', () => {
      const newEmployee: CreateEmployeeRequest = {
        email: 'employee@test.com',
        position: 'Développeur',
        generate_password: true,
        phone: '+216 12 345 678',
        salary: 2500.0
      };

      service.createEmployee(newEmployee).subscribe(employee => {
        expect(employee).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newEmployee);
      req.flush(mockEmployee);
    });

    it('should update employee', () => {
      const updatePayload: UpdateEmployeeRequest = { position: 'Senior Développeur' };
      const updatedEmployee = { ...mockEmployee, position: 'Senior Développeur' };

      service.updateEmployee(1, updatePayload).subscribe(employee => {
        expect(employee).toEqual(updatedEmployee);
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updatePayload);
      req.flush(updatedEmployee);
    });

    it('should delete employee', () => {
      service.deleteEmployee(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
  // Removed Work Sessions & custom Statistics tests: these methods do not exist in EmployeeService

  describe('Error Handling', () => {
    it('should handle HTTP errors', () => {
      service.getEmployees().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.employeesUrl}/`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
