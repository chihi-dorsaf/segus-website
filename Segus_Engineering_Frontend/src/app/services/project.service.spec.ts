import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ProjectService } from './project.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Project, ProjectStatus, UserSimple, CreateProject, UpdateProject } from '../models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const user1: UserSimple = { id: 1, username: 'u1', email: 'u1@test.com', role: 'EMPLOYE', is_active: true };
  const user2: UserSimple = { id: 2, username: 'u2', email: 'u2@test.com', role: 'EMPLOYE', is_active: true };

  const mockProject: Project = {
    id: 1,
    name: 'P1',
    title: 'Test Project',
    description: 'Test Description',
    status: ProjectStatus.ACTIVE,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    assigned_employees: [user1, user2],
    created_by: user1,
    tasks: [],
    progress_percentage: 0,
    total_tasks: 0,
    completed_tasks: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const authServiceMock = {
      getToken: () => 'test-token',
      fetchCurrentUser: () => of({} as any),
      getCurrentUser: () => ({} as any),
      logout: () => {}
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        ProjectService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Projects', () => {
    it('should get all projects (paginated)', () => {
      const mockResponse = { count: 1, next: null, previous: null, results: [mockProject] };

      service.getProjects().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get project by id', () => {
      service.getProject(1).subscribe(project => {
        expect(project).toEqual(mockProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProject);
    });

    it('should create project', () => {
      const newProject: CreateProject = {
        title: mockProject.title,
        description: mockProject.description,
        start_date: mockProject.start_date,
        end_date: mockProject.end_date,
        status: ProjectStatus.ACTIVE,
        assigned_employee_ids: [user1.id, user2.id]
      };

      service.createProject(newProject).subscribe(project => {
        expect(project).toEqual(mockProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProject);
      req.flush(mockProject);
    });

    it('should update project', () => {
      const payload: UpdateProject = { title: 'Updated Project' };
      const updatedProject = { ...mockProject, title: 'Updated Project' };

      service.updateProject(1, payload).subscribe(project => {
        expect(project).toEqual(updatedProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(updatedProject);
    });

    it('should delete project', () => {
      service.deleteProject(1).subscribe(response => {
        expect(response as any).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should get projects by status', () => {
      const mockProjects = [mockProject];

      service.getProjectsByStatus('ACTIVE').subscribe(projects => {
        expect(projects).toEqual(mockProjects);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/projects/by-status/?status=ACTIVE`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', () => {
      service.getProjects().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const r1 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      r1.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      const r2 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      r2.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      const r3 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      r3.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.getProjects().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const n1 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      n1.error(new ErrorEvent('Network error'));
      const n2 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      n2.error(new ErrorEvent('Network error'));
      const n3 = httpMock.expectOne(`${environment.apiUrl}/api/projects/?page=1`);
      n3.error(new ErrorEvent('Network error'));
    });
  });
});
