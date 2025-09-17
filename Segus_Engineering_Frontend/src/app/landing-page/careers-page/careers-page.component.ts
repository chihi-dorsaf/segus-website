import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JobService, JobOffer } from '../../services/job.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Using JobOffer interface from service

@Component({
  selector: 'app-careers-page',
  templateUrl: './careers-page.component.html',
  styleUrls: ['./careers-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CareersPageComponent implements OnInit, OnDestroy {
  // Form
  applicationForm: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = false;
  
  // Jobs data
  jobs: JobOffer[] = [];
  filteredJobs: JobOffer[] = [];
  selectedCategory: string = 'all';
  categories = [
    { value: 'all', label: 'Tous les postes' },
    { value: 'engineering', label: 'Ingénierie' },
    { value: 'development', label: 'Développement' },
    { value: 'management', label: 'Management' }
  ];

  // Slider
  currentSlide = 0;
  totalSlides = 3;
  sliderInterval: any;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService
  ) {
    this.applicationForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      current_position: [''],
      experience_years: [0, [Validators.required, Validators.min(0)]],
      education: [''],
      motivation_letter: ['', [Validators.required, Validators.minLength(50)]],
      portfolio_url: [''],
      linkedin_url: [''],
      job_offer_id: [null], // null for spontaneous applications
      cv_file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadJobs();
    this.startSlider();
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  private loadJobs(): void {
    this.jobService.getJobOffers()
      .pipe(
        catchError(error => {
          console.error('Error loading jobs:', error);
          // Fallback to mock data
          return this.jobService.getJobOffersMock();
        })
      )
      .subscribe(jobs => {
        this.jobs = jobs.filter(job => job.isActive);
        this.filterJobs();
      });
  }

  filterJobs(): void {
    if (this.selectedCategory === 'all') {
      this.filteredJobs = [...this.jobs];
    } else {
      this.filteredJobs = this.jobs.filter(job => job.category === this.selectedCategory);
    }
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.filterJobs();
  }

  // Slider methods
  startSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
  }

  prevSlide(): void {
    this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  // Form methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.applicationForm.patchValue({ cv_file: file });
    }
  }

  applyToJob(jobId: number): void {
    this.applicationForm.patchValue({ job_offer_id: jobId });
    this.scrollToSection('application');
  }

  applySpontaneous(): void {
    this.applicationForm.patchValue({ job_offer_id: null });
    this.scrollToSection('application');
  }

  onSubmit(): void {
    if (this.applicationForm.valid && this.selectedFile) {
      this.isSubmitting = true;
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.keys(this.applicationForm.value).forEach(key => {
        if (key !== 'cv_file' && this.applicationForm.value[key] !== null) {
          formData.append(key, this.applicationForm.value[key]);
        }
      });
      
      // Add file
      if (this.selectedFile) {
        formData.append('cv_file', this.selectedFile);
      }
      
      // Determine if it's spontaneous or for specific job
      const isSpontaneous = !this.applicationForm.value.job_offer_id;
      
      const submitObservable = isSpontaneous 
        ? this.jobService.submitSpontaneousApplication(formData)
        : this.jobService.submitJobApplication(formData);
      
      submitObservable
        .pipe(
          catchError(error => {
            console.error('Error submitting application:', error);
            alert('Erreur lors de l\'envoi de la candidature. Veuillez réessayer.');
            return of(null);
          })
        )
        .subscribe(response => {
          this.isSubmitting = false;
          if (response) {
            alert('Votre candidature a été envoyée avec succès! Nous vous contacterons bientôt.');
            this.applicationForm.reset();
            this.selectedFile = null;
          }
        });
    } else {
      alert('Veuillez remplir tous les champs requis et sélectionner un CV.');
    }
  }

  // Utility methods
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'engineering':
        return 'fas fa-cogs';
      case 'development':
        return 'fas fa-code';
      case 'management':
        return 'fas fa-users-cog';
      default:
        return 'fas fa-briefcase';
    }
  }

  trackByJobId(index: number, job: JobOffer): number {
    return job.id;
  }

  getJobById(id: number): JobOffer | undefined {
    return this.jobs.find(job => job.id === id);
  }
}
