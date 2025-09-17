import { Component, OnInit, OnDestroy } from '@angular/core';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image: string;
  skills: string[];
  experience: number;
  projects: number;
  linkedin?: string;
  email?: string;
  github?: string;
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit, OnDestroy {
  currentSlide: number = 0;
  slideInterval: any;
  teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Dr. Ahmed Segus',
      role: 'Directeur Technique',
      description: 'Expert en intelligence artificielle et automatisation industrielle avec une vision stratégique de l\'innovation.',
      image: 'assets/img/team_1.jpg',
      skills: ['IA', 'Machine Learning', 'Automatisation', 'Leadership'],
      experience: 15,
      projects: 120,
      linkedin: 'https://linkedin.com/in/ahmed-segus',
      email: 'mailto:ahmed@segus-engineering.com',
      github: 'https://github.com/ahmed-segus'
    },
    {
      id: 2,
      name: 'Ing. Marie Dubois',
      role: 'Ingénieure Mécanique Senior',
      description: 'Spécialiste en conception CAO/DAO et simulation numérique pour l\'industrie automobile et aéronautique.',
      image: 'assets/img/team_2.jpg',
      skills: ['SolidWorks', 'ANSYS', 'CAO/DAO', 'Simulation'],
      experience: 12,
      projects: 85,
      linkedin: 'https://linkedin.com/in/marie-dubois',
      email: 'mailto:marie@segus-engineering.com'
    },
    {
      id: 3,
      name: 'Ing. Jean-Pierre Martin',
      role: 'Expert Automatisation',
      description: 'Architecte de solutions SCADA et systèmes de contrôle industriel pour l\'Industrie 4.0.',
      image: 'assets/img/team_3.jpg',
      skills: ['SCADA', 'PLC', 'IoT', 'Robotique'],
      experience: 10,
      projects: 95,
      linkedin: 'https://linkedin.com/in/jp-martin',
      email: 'mailto:jean-pierre@segus-engineering.com'
    },
    {
      id: 4,
      name: 'Dr. Sophie Laurent',
      role: 'Ingénieure Électronique',
      description: 'Conceptrice de systèmes électroniques embarqués et solutions IoT pour l\'industrie connectée.',
      image: 'assets/img/team_4.jpg',
      skills: ['PCB Design', 'Microcontrôleurs', 'IoT', 'Capteurs'],
      experience: 8,
      projects: 70,
      linkedin: 'https://linkedin.com/in/sophie-laurent',
      email: 'mailto:sophie@segus-engineering.com',
      github: 'https://github.com/sophie-laurent'
    },
    {
      id: 5,
      name: 'Ing. Thomas Schneider',
      role: 'Développeur Full-Stack',
      description: 'Architecte logiciel spécialisé dans les applications web et l\'intégration de systèmes complexes.',
      image: 'assets/img/team_5.jpg',
      skills: ['Angular', 'Node.js', 'Python', 'DevOps'],
      experience: 7,
      projects: 60,
      linkedin: 'https://linkedin.com/in/thomas-schneider',
      email: 'mailto:thomas@segus-engineering.com',
      github: 'https://github.com/thomas-schneider'
    },
    {
      id: 6,
      name: 'Dr. Catherine Moreau',
      role: 'Data Scientist',
      description: 'Experte en analyse de données et intelligence artificielle pour l\'optimisation des processus industriels.',
      image: 'assets/img/team_6.jpg',
      skills: ['Python', 'Machine Learning', 'Big Data', 'Analytics'],
      experience: 9,
      projects: 75,
      linkedin: 'https://linkedin.com/in/catherine-moreau',
      email: 'mailto:catherine@segus-engineering.com'
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  trackByMemberId(index: number, member: TeamMember): number {
    return member.id;
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 2) % this.teamMembers.length;
    if (this.currentSlide >= this.teamMembers.length - 1) {
      this.currentSlide = 0;
    }
  }

  previousSlide() {
    this.currentSlide = this.currentSlide <= 1 ? this.teamMembers.length - 2 : this.currentSlide - 2;
    if (this.currentSlide < 0) {
      this.currentSlide = this.teamMembers.length - 2;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index * 2;
  }

  getSlideIndicators(): number[] {
    const maxSlides = Math.ceil(this.teamMembers.length / 2);
    return Array(maxSlides).fill(0).map((_, i) => i);
  }
}
