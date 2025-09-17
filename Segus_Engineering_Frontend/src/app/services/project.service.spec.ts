import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { environment } from '../../environments/environment';
import { Project, Task, SubTask } from '../models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const mockProject: Project = {
    id: 1,
    title: 'Test Project',
    description: 'Test Description',
    status: 'ACTIVE',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    assigned_employees: [1, 2],
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Task Description',
    status: 'TODO',
    priority: 'MEDIUM',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    project: 1,
    assigned_employees: [1],
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockSubTask: SubTask = {
    id: 1,
    section_name: 'Test Section',
    section_number: 'S001',
    section_id: 'section_001',
    kilometrage: 25.5,
    is_completed: false,
    task: 1,
    assigned_employees: [1],
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
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
    it('should get all projects', () => {
      const mockProjects = [mockProject];

      service.getProjects().subscribe(projects => {
        expect(projects).toEqual(mockProjects);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });

    it('should get project by id', () => {
      service.getProject(1).subscribe(project => {
        expect(project).toEqual(mockProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProject);
    });

    it('should create project', () => {
      const newProject = { ...mockProject };
      delete newProject.id;

      service.createProject(newProject).subscribe(project => {
        expect(project).toEqual(mockProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProject);
      req.flush(mockProject);
    });

    it('should update project', () => {
      const updatedProject = { ...mockProject, title: 'Updated Project' };

      service.updateProject(1, updatedProject).subscribe(project => {
        expect(project).toEqual(updatedProject);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedProject);
      req.flush(updatedProject);
    });

    it('should delete project', () => {
      service.deleteProject(1).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should get projects by status', () => {
      const mockProjects = [mockProject];

      service.getProjectsByStatus('ACTIVE').subscribe(projects => {
        expect(projects).toEqual(mockProjects);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/?status=ACTIVE`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });
  });

  describe('Tasks', () => {
    it('should get all tasks', () => {
      const mockTasks = [mockTask];

      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should get task by id', () => {
      service.getTask(1).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });

    it('should create task', () => {
      const newTask = { ...mockTask };
      delete newTask.id;

      service.createTask(newTask).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush(mockTask);
    });

    it('should update task', () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };

      service.updateTask(1, updatedTask).subscribe(task => {
        expect(task).toEqual(updatedTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedTask);
      req.flush(updatedTask);
    });

    it('should delete task', () => {
      service.deleteTask(1).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should get tasks by project', () => {
      const mockTasks = [mockTask];

      service.getTasksByProject(1).subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/?project=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should get tasks by status', () => {
      const mockTasks = [mockTask];

      service.getTasksByStatus('TODO').subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/?status=TODO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('SubTasks', () => {
    it('should get all subtasks', () => {
      const mockSubTasks = [mockSubTask];

      service.getSubTasks().subscribe(subtasks => {
        expect(subtasks).toEqual(mockSubTasks);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSubTasks);
    });

    it('should get subtask by id', () => {
      service.getSubTask(1).subscribe(subtask => {
        expect(subtask).toEqual(mockSubTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSubTask);
    });

    it('should create subtask', () => {
      const newSubTask = { ...mockSubTask };
      delete newSubTask.id;

      service.createSubTask(newSubTask).subscribe(subtask => {
        expect(subtask).toEqual(mockSubTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newSubTask);
      req.flush(mockSubTask);
    });

    it('should update subtask', () => {
      const updatedSubTask = { ...mockSubTask, section_name: 'Updated Section' };

      service.updateSubTask(1, updatedSubTask).subscribe(subtask => {
        expect(subtask).toEqual(updatedSubTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedSubTask);
      req.flush(updatedSubTask);
    });

    it('should delete subtask', () => {
      service.deleteSubTask(1).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should get subtasks by task', () => {
      const mockSubTasks = [mockSubTask];

      service.getSubTasksByTask(1).subscribe(subtasks => {
        expect(subtasks).toEqual(mockSubTasks);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/?task=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSubTasks);
    });

    it('should mark subtask as completed', () => {
      const completedSubTask = { ...mockSubTask, is_completed: true };

      service.markSubTaskCompleted(1).subscribe(subtask => {
        expect(subtask).toEqual(completedSubTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/1/mark_completed/`);
      expect(req.request.method).toBe('POST');
      req.flush(completedSubTask);
    });

    it('should mark subtask as uncompleted', () => {
      const uncompletedSubTask = { ...mockSubTask, is_completed: false };

      service.markSubTaskUncompleted(1).subscribe(subtask => {
        expect(subtask).toEqual(uncompletedSubTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subtasks/1/mark_uncompleted/`);
      expect(req.request.method).toBe('POST');
      req.flush(uncompletedSubTask);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.getProjects().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.name).toBe('HttpErrorResponse');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/projects/`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});
