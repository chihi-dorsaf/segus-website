import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GamificationService } from './gamification.service';
import { environment } from '../../environments/environment';

describe('GamificationService', () => {
  let service: GamificationService;
  let httpMock: HttpTestingController;

  const mockDailyObjective = {
    id: 1,
    employee: 1,
    date: '2024-01-01',
    target_subtasks: 10,
    target_hours: 8.00,
    created_by: 1
  };

  const mockDailyPerformance = {
    id: 1,
    employee: 1,
    date: '2024-01-01',
    completed_subtasks: 8,
    work_hours: 7.5,
    overtime_hours: 0,
    stars_earned: 0.25,
    points_earned: 18
  };

  const mockBadge = {
    id: 1,
    name: 'Développeur Expert',
    description: 'Badge pour développeurs expérimentés',
    icon: 'expert.png',
    required_stars: 10,
    required_points: 500,
    salary_increase_percentage: 5.00
  };

  const mockEmployeeBadge = {
    id: 1,
    employee: 1,
    badge: mockBadge,
    earned_at: '2024-01-01T00:00:00Z',
    stars_at_earning: 12,
    points_at_earning: 550
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GamificationService]
    });

    service = TestBed.inject(GamificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Daily Objectives', () => {
    it('should get daily objectives', () => {
      const mockObjectives = [mockDailyObjective];

      service.getDailyObjectives().subscribe(objectives => {
        expect(objectives).toEqual(mockObjectives);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-objectives/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockObjectives);
    });

    it('should create daily objective', () => {
      const newObjective = { ...mockDailyObjective };
      delete newObjective.id;

      service.createDailyObjective(newObjective).subscribe(objective => {
        expect(objective).toEqual(mockDailyObjective);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-objectives/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newObjective);
      req.flush(mockDailyObjective);
    });

    it('should get daily objective by employee and date', () => {
      service.getDailyObjectiveByEmployeeAndDate(1, '2024-01-01').subscribe(objective => {
        expect(objective).toEqual(mockDailyObjective);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-objectives/?employee=1&date=2024-01-01`);
      expect(req.request.method).toBe('GET');
      req.flush([mockDailyObjective]);
    });
  });

  describe('Daily Performance', () => {
    it('should get daily performances', () => {
      const mockPerformances = [mockDailyPerformance];

      service.getDailyPerformances().subscribe(performances => {
        expect(performances).toEqual(mockPerformances);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-performances/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPerformances);
    });

    it('should get daily performance by employee', () => {
      const mockPerformances = [mockDailyPerformance];

      service.getDailyPerformanceByEmployee(1).subscribe(performances => {
        expect(performances).toEqual(mockPerformances);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-performances/?employee=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPerformances);
    });

    it('should calculate daily performance', () => {
      service.calculateDailyPerformance(1, '2024-01-01').subscribe(performance => {
        expect(performance).toEqual(mockDailyPerformance);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/daily-performances/calculate/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ employee: 1, date: '2024-01-01' });
      req.flush(mockDailyPerformance);
    });
  });

  describe('Badges', () => {
    it('should get all badges', () => {
      const mockBadges = [mockBadge];

      service.getBadges().subscribe(badges => {
        expect(badges).toEqual(mockBadges);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/badges/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBadges);
    });

    it('should create badge', () => {
      const newBadge = { ...mockBadge };
      delete newBadge.id;

      service.createBadge(newBadge).subscribe(badge => {
        expect(badge).toEqual(mockBadge);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/badges/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newBadge);
      req.flush(mockBadge);
    });

    it('should get employee badges', () => {
      const mockEmployeeBadges = [mockEmployeeBadge];

      service.getEmployeeBadges(1).subscribe(badges => {
        expect(badges).toEqual(mockEmployeeBadges);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/employee-badges/?employee=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployeeBadges);
    });

    it('should award badge to employee', () => {
      service.awardBadge(1, 1).subscribe(employeeBadge => {
        expect(employeeBadge).toEqual(mockEmployeeBadge);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/employee-badges/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ employee: 1, badge: 1 });
      req.flush(mockEmployeeBadge);
    });
  });

  describe('Statistics', () => {
    it('should get employee gamification stats', () => {
      const mockStats = {
        total_stars: 15.5,
        total_points: 750,
        badges_count: 3,
        current_level: 'Expert',
        monthly_performance: {
          completed_subtasks: 200,
          total_work_hours: 160,
          overtime_hours: 20
        }
      };

      service.getEmployeeGamificationStats(1).subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/employee-stats/1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });

    it('should get leaderboard', () => {
      const mockLeaderboard = [
        { employee_id: 1, employee_name: 'John Doe', total_stars: 20, total_points: 1000 },
        { employee_id: 2, employee_name: 'Jane Smith', total_stars: 18, total_points: 900 }
      ];

      service.getLeaderboard().subscribe(leaderboard => {
        expect(leaderboard).toEqual(mockLeaderboard);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/leaderboard/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLeaderboard);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', () => {
      service.getBadges().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gamification/badges/`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
