import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JobOffer {
  id: number;
  title: string;
  category: string;
  location: string;
  type: string; // CDI, CDD, Stage, Freelance
  description: string;
  requirements: string[];
  skills: string[];
  salary?: string;
  experience: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: number;
  jobOfferId?: number | null; // null pour candidature spontanée
  jobTitle?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experience: string;
  motivation: string;
  cvFileName: string;
  cvUrl?: string;
  status: 'new' | 'reviewed' | 'interview' | 'accepted' | 'rejected';
  isSpontaneous: boolean;
  appliedAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

export interface JobStats {
  totalOffers: number;
  activeOffers: number;
  totalApplications: number;
  newApplications: number;
  spontaneousApplications: number;
  interviewApplications: number;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/api/jobs`;

  constructor(private http: HttpClient) {}

  // Job Offers Management
  getJobOffers(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.apiUrl}/offers/`);
  }

  getJobOffersMock(): Observable<JobOffer[]> {
    // Fallback mock data
    return of([
      {
        id: 1,
        title: 'Ingénieur IA Senior',
        category: 'engineering',
        location: 'Tunis / Remote',
        type: 'CDI',
        description: 'Développez des algorithmes de machine learning avancés et participez à l\'innovation en intelligence artificielle',
        requirements: [
          'Master en IA/Machine Learning ou équivalent',
          'Expertise en Python, TensorFlow, PyTorch',
          'Expérience en deep learning et NLP',
          '5+ ans d\'expérience en développement IA'
        ],
        skills: ['Python', 'TensorFlow', 'Deep Learning', 'NLP'],
        salary: '45000-65000 TND',
        experience: '5+ ans',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        title: 'Développeur Full Stack',
        category: 'development',
        location: 'Tunis',
        type: 'CDI',
        description: 'Créez des applications web modernes et performantes avec les dernières technologies',
        requirements: [
          'Maîtrise de React/Angular et Node.js',
          'Connaissance des bases de données SQL/NoSQL',
          'Expérience avec les API REST',
          '3+ ans d\'expérience en développement web'
        ],
        skills: ['Angular', 'Node.js', 'TypeScript', 'MongoDB'],
        salary: '35000-50000 TND',
        experience: '3+ ans',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ]);
  }

  getJobOffer(id: number): Observable<JobOffer | null> {
    return this.http.get<JobOffer>(`${this.apiUrl}/offers/${id}/`);
  }

  createJobOffer(offer: Omit<JobOffer, 'id' | 'createdAt' | 'updatedAt'>): Observable<JobOffer> {
    return this.http.post<JobOffer>(`${this.apiUrl}/offers/`, offer);
  }

  updateJobOffer(id: number, offer: Partial<JobOffer>): Observable<JobOffer> {
    return this.http.put<JobOffer>(`${this.apiUrl}/offers/${id}/`, offer);
  }

  deleteJobOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/offers/${id}/`);
  }

  toggleJobOfferStatus(id: number): Observable<JobOffer> {
    return this.http.patch<JobOffer>(`${this.apiUrl}/offers/${id}/toggle-status/`, {});
  }

  // Job Applications Management
  getJobApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.apiUrl}/applications/`);
  }

  getJobApplicationsMock(): Observable<JobApplication[]> {
    // Fallback mock data
    return of([
      {
        id: 1,
        jobOfferId: 1,
        jobTitle: 'Ingénieur IA Senior',
        applicantName: 'Ahmed Ben Ali',
        applicantEmail: 'ahmed.benali@email.com',
        applicantPhone: '+216 20 123 456',
        experience: '6 ans',
        motivation: 'Passionné par l\'IA et le machine learning, je souhaite contribuer à vos projets innovants...',
        cvFileName: 'ahmed_benali_cv.pdf',
        status: 'new',
        isSpontaneous: false,
        appliedAt: new Date('2024-01-20'),
        notes: ''
      },
      {
        id: 2,
        jobOfferId: null,
        jobTitle: 'Candidature Spontanée',
        applicantName: 'Fatma Trabelsi',
        applicantEmail: 'fatma.trabelsi@email.com',
        applicantPhone: '+216 25 789 123',
        experience: '4 ans',
        motivation: 'Développeuse expérimentée, je souhaite rejoindre votre équipe dynamique...',
        cvFileName: 'fatma_trabelsi_cv.pdf',
        status: 'reviewed',
        isSpontaneous: true,
        appliedAt: new Date('2024-01-18'),
        reviewedAt: new Date('2024-01-19'),
        notes: 'Profil intéressant pour le développement web'
      },
      {
        id: 3,
        jobOfferId: 2,
        jobTitle: 'Développeur Full Stack',
        applicantName: 'Mohamed Khalil',
        applicantEmail: 'mohamed.khalil@email.com',
        applicantPhone: '+216 22 456 789',
        experience: '3 ans',
        motivation: 'Développeur passionné avec une solide expérience en Angular et Node.js...',
        cvFileName: 'mohamed_khalil_cv.pdf',
        status: 'interview',
        isSpontaneous: false,
        appliedAt: new Date('2024-01-16'),
        reviewedAt: new Date('2024-01-17'),
        notes: 'Candidat prometteur, entretien programmé'
      }
    ]);
  }

  getJobApplication(id: number): Observable<JobApplication | null> {
    return this.http.get<JobApplication>(`${this.apiUrl}/applications/${id}/`);
  }

  updateApplicationStatus(id: number, status: JobApplication['status'], notes?: string): Observable<JobApplication> {
    return this.http.patch<JobApplication>(`${this.apiUrl}/applications/${id}/status/`, { status, notes });
  }

  deleteJobApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/applications/${id}/`);
  }

  // Statistics
  getJobStats(): Observable<JobStats> {
    return this.http.get<JobStats>(`${this.apiUrl}/applications/stats/`);
  }

  getJobStatsMock(): Observable<JobStats> {
    // Fallback mock data
    return of({
      totalOffers: 2,
      activeOffers: 2,
      totalApplications: 3,
      newApplications: 1,
      spontaneousApplications: 1,
      interviewApplications: 1
    });
  }

  // Job Application Submission
  submitJobApplication(applicationData: FormData): Observable<JobApplication> {
    return this.http.post<JobApplication>(`${this.apiUrl}/applications/`, applicationData);
  }

  // Submit spontaneous application
  submitSpontaneousApplication(applicationData: FormData): Observable<JobApplication> {
    return this.http.post<JobApplication>(`${this.apiUrl}/applications/spontaneous/`, applicationData);
  }

  // Utility methods
  getStatusColor(status: JobApplication['status']): string {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'reviewed': return '#f59e0b';
      case 'interview': return '#8b5cf6';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusIcon(status: JobApplication['status']): string {
    switch (status) {
      case 'new': return 'fas fa-envelope';
      case 'reviewed': return 'fas fa-eye';
      case 'interview': return 'fas fa-users';
      case 'accepted': return 'fas fa-check-circle';
      case 'rejected': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  }

  getStatusLabel(status: JobApplication['status']): string {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'reviewed': return 'Examiné';
      case 'interview': return 'Entretien';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'engineering': return 'fas fa-cogs';
      case 'development': return 'fas fa-code';
      case 'management': return 'fas fa-users-cog';
      case 'design': return 'fas fa-palette';
      case 'marketing': return 'fas fa-bullhorn';
      default: return 'fas fa-briefcase';
    }
  }
}
