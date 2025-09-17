import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { JobService, JobOffer, JobStats } from '../../services/job.service';

@Component({
  selector: 'app-admin-job-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-job-offers.component.html',
  styleUrls: ['./admin-job-offers.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminJobOffersComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  stats: JobStats | null = null;
  selectedOffer: JobOffer | null = null;
  loading = false;
  showModal = false;
  isEditing = false;

  // Filtres
  selectedCategory = '';
  selectedType = '';
  selectedStatus = '';
  searchTerm = '';

  // Form
  offerForm: FormGroup;

  // Options
  categories = [
    { value: 'engineering', label: 'Ingénierie' },
    { value: 'development', label: 'Développement' },
    { value: 'management', label: 'Management' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' }
  ];

  jobTypes = [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'Stage', label: 'Stage' },
    { value: 'Freelance', label: 'Freelance' }
  ];

  experienceLevels = [
    { value: 'Junior (0-2 ans)', label: 'Junior (0-2 ans)' },
    { value: 'Confirmé (3-5 ans)', label: 'Confirmé (3-5 ans)' },
    { value: 'Senior (5+ ans)', label: 'Senior (5+ ans)' },
    { value: 'Expert (10+ ans)', label: 'Expert (10+ ans)' }
  ];

  constructor(
    private jobService: JobService,
    private fb: FormBuilder
  ) {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      location: ['', Validators.required],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(50)]],
      requirements: this.fb.array([]),
      skills: this.fb.array([]),
      salary: [''],
      experience: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadJobOffers();
    this.loadStats();
  }

  loadJobOffers(): void {
    this.loading = true;
    this.jobService.getJobOffers().subscribe({
      next: (offers) => {
        this.jobOffers = offers;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement offres:', error);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.jobService.getJobStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur chargement stats:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredOffers = this.jobOffers.filter(offer => {
      const matchesCategory = !this.selectedCategory || offer.category === this.selectedCategory;
      const matchesType = !this.selectedType || offer.type === this.selectedType;
      const matchesStatus = !this.selectedStatus || 
        (this.selectedStatus === 'active' && offer.isActive) ||
        (this.selectedStatus === 'inactive' && !offer.isActive);
      const matchesSearch = !this.searchTerm || 
        offer.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        offer.location.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesCategory && matchesType && matchesStatus && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // Form Array Helpers
  get requirements(): FormArray {
    return this.offerForm.get('requirements') as FormArray;
  }

  get skills(): FormArray {
    return this.offerForm.get('skills') as FormArray;
  }

  addRequirement(): void {
    this.requirements.push(this.fb.control('', Validators.required));
  }

  removeRequirement(index: number): void {
    this.requirements.removeAt(index);
  }

  addSkill(): void {
    this.skills.push(this.fb.control('', Validators.required));
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  // Modal Management
  openCreateModal(): void {
    this.isEditing = false;
    this.selectedOffer = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(offer: JobOffer): void {
    this.isEditing = true;
    this.selectedOffer = offer;
    this.populateForm(offer);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOffer = null;
    this.resetForm();
  }

  resetForm(): void {
    this.offerForm.reset();
    this.requirements.clear();
    this.skills.clear();
    this.offerForm.patchValue({ isActive: true });
  }

  populateForm(offer: JobOffer): void {
    this.resetForm();
    
    this.offerForm.patchValue({
      title: offer.title,
      category: offer.category,
      location: offer.location,
      type: offer.type,
      description: offer.description,
      salary: offer.salary,
      experience: offer.experience,
      isActive: offer.isActive
    });

    // Populate requirements
    offer.requirements.forEach(req => {
      this.requirements.push(this.fb.control(req, Validators.required));
    });

    // Populate skills
    offer.skills.forEach(skill => {
      this.skills.push(this.fb.control(skill, Validators.required));
    });
  }

  onSubmit(): void {
    if (this.offerForm.valid) {
      const formData = this.offerForm.value;
      
      if (this.isEditing && this.selectedOffer) {
        this.updateOffer(this.selectedOffer.id, formData);
      } else {
        this.createOffer(formData);
      }
    } else {
      this.markFormGroupTouched(this.offerForm);
    }
  }

  createOffer(offerData: any): void {
    this.jobService.createJobOffer(offerData).subscribe({
      next: (offer) => {
        this.jobOffers.unshift(offer);
        this.applyFilters();
        this.loadStats();
        this.closeModal();
        alert('Offre créée avec succès!');
      },
      error: (error) => {
        console.error('Erreur création offre:', error);
        alert('Erreur lors de la création de l\'offre');
      }
    });
  }

  updateOffer(id: number, offerData: any): void {
    this.jobService.updateJobOffer(id, offerData).subscribe({
      next: (updatedOffer) => {
        const index = this.jobOffers.findIndex(o => o.id === id);
        if (index !== -1) {
          this.jobOffers[index] = updatedOffer;
          this.applyFilters();
          this.loadStats();
        }
        this.closeModal();
        alert('Offre mise à jour avec succès!');
      },
      error: (error) => {
        console.error('Erreur mise à jour offre:', error);
        alert('Erreur lors de la mise à jour de l\'offre');
      }
    });
  }

  toggleOfferStatus(offer: JobOffer): void {
    if (confirm(`Voulez-vous ${offer.isActive ? 'désactiver' : 'activer'} cette offre?`)) {
      this.jobService.toggleJobOfferStatus(offer.id).subscribe({
        next: (updatedOffer) => {
          const index = this.jobOffers.findIndex(o => o.id === offer.id);
          if (index !== -1) {
            this.jobOffers[index] = updatedOffer;
            this.applyFilters();
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
          alert('Erreur lors du changement de statut');
        }
      });
    }
  }

  deleteOffer(offer: JobOffer): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${offer.title}"?`)) {
      this.jobService.deleteJobOffer(offer.id).subscribe({
        next: () => {
          this.jobOffers = this.jobOffers.filter(o => o.id !== offer.id);
          this.applyFilters();
          this.loadStats();
          alert('Offre supprimée avec succès!');
        },
        error: (error) => {
          console.error('Erreur suppression offre:', error);
          alert('Erreur lors de la suppression de l\'offre');
        }
      });
    }
  }

  // Utility methods
  getCategoryIcon(category: string): string {
    return this.jobService.getCategoryIcon(category);
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getTypeLabel(type: string): string {
    const jobType = this.jobTypes.find(t => t.value === type);
    return jobType ? jobType.label : type;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  trackByOfferId(index: number, offer: JobOffer): number {
    return offer.id;
  }
}
