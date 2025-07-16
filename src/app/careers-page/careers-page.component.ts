import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

interface Benefit {
  id: number;
  title: string;
  icon: string;
  items: string[];
}

interface Job {
  id: number;
  title: string;
  category: string;
  location: string;
  type: string;
  description: string;
}

interface Contact {
  id: number;
  title: string;
  value: string;
  icon: string;
  link?: string;
}

interface Slide {
  id: number;
  image: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-careers-page',
  templateUrl: './careers-page.component.html',
  styleUrls: ['./careers-page.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.benefit-card, .job-card, .contact-item', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class CareersPageComponent implements OnInit, AfterViewInit {
  @ViewChild('careerSwiper') careerSwiper!: ElementRef;

  applicationForm: FormGroup;
  fileName: string | null = null;
  selectedFilter: string = 'all';
  benefits: Benefit[] = [
    {
      id: 1,
      title: 'Innovation Continue',
      icon: 'fas fa-rocket',
      items: [
        'Projets cutting-edge en IA et ingénierie',
        'Accès aux dernières technologies',
        'Recherche et développement avancé'
      ]
    },
    {
      id: 2,
      title: 'Développement Professionnel',
      icon: 'fas fa-chart-line',
      items: [
        'Formations continues',
        'Mentorat personnalisé',
        'Évolution de carrière rapide'
      ]
    },
    {
      id: 3,
      title: 'Environnement de Travail',
      icon: 'fas fa-users',
      items: [
        'Télétravail flexible',
        'Bureaux modernes',
        'Équipe multiculturelle'
      ]
    },
    {
      id: 4,
      title: 'Avantages Sociaux',
      icon: 'fas fa-gift',
      items: [
        'Salaire compétitif',
        'Assurance santé premium',
        'Congés payés généreux',
        'Primes de performance'
      ]
    }
  ];

  jobs: Job[] = [
    {
      id: 1,
      title: 'Ingénieur IA Senior',
      category: 'engineering',
      location: 'Remote/Tunis',
      type: 'CDI',
      description: 'Développement d’algorithmes de machine learning avancés pour nos solutions IA. Expertise requise en Python, TensorFlow, et méthodes d’apprentissage profond.'
    },
    {
      id: 2,
      title: 'Développeur Full Stack',
      category: 'development',
      location: 'Tunis',
      type: 'CDI/Stage',
      description: 'Développement d’applications web modernes avec React/Node.js. Participation à toutes les phases du cycle de développement.'
    },
    {
      id: 3,
      title: 'Chef de Projet Technique',
      category: 'management',
      location: 'Tunis',
      type: 'CDI',
      description: 'Gestion d’équipe technique et coordination de projets complexes. Leadership et expertise technique requises.'
    }
  ];

  contactInfo: Contact[] = [
    {
      id: 1,
      title: 'Adresse',
      value: 'Tunis, Tunisie',
      icon: 'fas fa-map-marker-alt'
    },
    {
      id: 2,
      title: 'Email RH',
      value: 'careers@segus-engineering.com',
      icon: 'fas fa-envelope',
      link: 'mailto:careers@segus-engineering.com'
    },
    {
      id: 3,
      title: 'Téléphone',
      value: '+216 XX XXX XXX',
      icon: 'fas fa-phone'
    },
    {
      id: 4,
      title: 'LinkedIn',
      value: '@segus-engineering',
      icon: 'fab fa-linkedin',
      link: 'https://linkedin.com/company/segus-engineering'
    },
    {
      id: 5,
      title: 'Horaires',
      value: 'Lundi-Vendredi 8h-17h',
      icon: 'fas fa-clock'
    }
  ];

  slides: Slide[] = [
    {
      id: 1,
      image: 'assets/images/career-slide1.jpg',
      title: 'Rejoignez Notre Équipe',
      text: 'Façonnez l’avenir avec Segus Engineering en travaillant sur des projets innovants.'
    },
    {
      id: 2,
      image: 'assets/images/career-slide2.jpg',
      title: 'Innovez avec Nous',
      text: 'Contribuez à des solutions d’IA et d’ingénierie de pointe à Tunis.'
    },
    {
      id: 3,
      image: 'assets/images/career-slide3.jpg',
      title: 'Développez Votre Carrière',
      text: 'Bénéficiez de formations et d’un environnement de travail dynamique.'
    }
  ];

  filteredJobs: Job[] = this.jobs;

  constructor(private fb: FormBuilder) {
    this.applicationForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      position: ['', Validators.required],
      cv: ['', Validators.required],
      motivation: ['', Validators.required],
      portfolio: ['']
    });
  }

  ngOnInit(): void {
    this.setFilter('all');
  }

  ngAfterViewInit(): void {
    if (this.careerSwiper && this.careerSwiper.nativeElement) {
      new Swiper(this.careerSwiper.nativeElement, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        }
      });
    } else {
      console.error('Career swiper element not found');
    }
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.filteredJobs = filter === 'all' ? this.jobs : this.jobs.filter(job => job.category === filter);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileName = input.files[0].name;
    } else {
      this.fileName = null;
    }
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      const formData = this.applicationForm.value;
      const mailtoLink = `mailto:careers@segus-engineering.com?subject=Candidature%20Spontanée&body=Nom:%20${encodeURIComponent(formData.fullName)}%0AEmail:%20${encodeURIComponent(formData.email)}%0ATéléphone:%20${encodeURIComponent(formData.phone)}%0APoste:%20${encodeURIComponent(formData.position)}%0AMotivation:%20${encodeURIComponent(formData.motivation)}%0APortfolio:%20${encodeURIComponent(formData.portfolio || '')}`;
      window.location.href = mailtoLink;
      alert('Merci pour votre candidature ! Nous vous recontacterons sous peu.');
    }
  }

  trackByBenefitId(index: number, benefit: Benefit): number {
    return benefit.id;
  }

  trackByJobId(index: number, job: Job): number {
    return job.id;
  }

  trackByContactId(index: number, contact: Contact): number {
    return contact.id;
  }

  trackBySlideId(index: number, slide: Slide): number {
    return slide.id;
  }
}
