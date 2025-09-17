import { Component, OnInit, OnDestroy } from '@angular/core';

interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  categoryLabel: string;
  technologies: string[];
  date: string;
  duration: string;
  client: string;
  link?: string;
}

interface PortfolioStat {
  icon: string;
  value: number;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, OnDestroy {
  selectedCategory: string = 'all';
  currentSlide: number = 0;
  slideInterval: any;
  projects: Project[] = [
    {
      id: 1,
      title: 'Système de Contrôle Industriel',
      description: 'Développement d\'un système SCADA pour l\'automatisation d\'une ligne de production.',
      image: 'assets/img/project1.jpg',
      category: 'automation',
      categoryLabel: 'Automatisation',
      technologies: ['SCADA', 'PLC', 'HMI', 'Ethernet/IP'],
      date: '2024',
      duration: '6 mois',
      client: 'Industrie Manufacturière'
    },
    {
      id: 2,
      title: 'Conception Mécanique CAO',
      description: 'Conception et simulation d\'un système mécanique complexe avec optimisation des performances.',
      image: 'assets/img/project2.jpg',
      category: 'mechanical',
      categoryLabel: 'Mécanique',
      technologies: ['SolidWorks', 'ANSYS', 'CAO/DAO', 'Simulation'],
      date: '2024',
      duration: '4 mois',
      client: 'Équipementier Automobile'
    },
    {
      id: 3,
      title: 'Application Web de Gestion',
      description: 'Développement d\'une application web complète pour la gestion des ressources d\'entreprise.',
      image: 'assets/img/project3.jpg',
      category: 'software',
      categoryLabel: 'Logiciel',
      technologies: ['Angular', 'Node.js', 'MongoDB', 'TypeScript'],
      date: '2023',
      duration: '8 mois',
      client: 'PME Technologique'
    },
    {
      id: 4,
      title: 'Carte Électronique IoT',
      description: 'Conception d\'une carte électronique pour objets connectés avec communication sans fil.',
      image: 'assets/img/project4.jpg',
      category: 'electronic',
      categoryLabel: 'Électronique',
      technologies: ['PCB Design', 'ESP32', 'LoRaWAN', 'Capteurs'],
      date: '2023',
      duration: '3 mois',
      client: 'Startup IoT'
    },
    {
      id: 5,
      title: 'Robot Collaboratif',
      description: 'Développement d\'un robot collaboratif pour l\'assistance en milieu industriel.',
      image: 'assets/img/project5.jpg',
      category: 'automation',
      categoryLabel: 'Automatisation',
      technologies: ['ROS', 'Vision', 'IA', 'Sécurité'],
      date: '2023',
      duration: '12 mois',
      client: 'Industrie 4.0'
    },
    {
      id: 6,
      title: 'Optimisation Énergétique',
      description: 'Système intelligent de gestion énergétique pour bâtiments industriels.',
      image: 'assets/img/project1.jpg',
      category: 'software',
      categoryLabel: 'Logiciel',
      technologies: ['Python', 'Machine Learning', 'IoT', 'Dashboard'],
      date: '2022',
      duration: '5 mois',
      client: 'Gestionnaire Immobilier'
    }
  ];

  portfolioStats: PortfolioStat[] = [
    {
      icon: 'fas fa-project-diagram',
      value: 150,
      suffix: '+',
      label: 'Projets Réalisés'
    },
    {
      icon: 'fas fa-users',
      value: 80,
      suffix: '+',
      label: 'Clients Satisfaits'
    },
    {
      icon: 'fas fa-award',
      value: 15,
      suffix: '',
      label: 'Prix & Certifications'
    },
    {
      icon: 'fas fa-clock',
      value: 98,
      suffix: '%',
      label: 'Livraison à Temps'
    }
  ];

  filteredProjects: Project[] = [];

  ngOnInit() {
    this.filteredProjects = this.projects;
    this.startAutoSlide();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  filterProjects(category: string) {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredProjects = this.projects;
    } else {
      this.filteredProjects = this.projects.filter(project => project.category === category);
    }
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }

  viewProject(project: Project) {
    console.log('Viewing project:', project.id);
    // Implement project detail view logic
  }

  openProject(project: Project) {
    if (project.link) {
      window.open(project.link, '_blank');
    }
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  nextSlide() {
    const maxSlides = Math.ceil(this.projects.length / 2);
    this.currentSlide = (this.currentSlide + 2) % this.projects.length;
    if (this.currentSlide >= this.projects.length - 1) {
      this.currentSlide = 0;
    }
  }

  previousSlide() {
    this.currentSlide = this.currentSlide <= 1 ? this.projects.length - 2 : this.currentSlide - 2;
    if (this.currentSlide < 0) {
      this.currentSlide = this.projects.length - 2;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  getSlideIndicators(): number[] {
    const maxSlides = Math.ceil(this.projects.length / 2);
    return Array(maxSlides).fill(0).map((_, i) => i);
  }
}
