import { Component, OnInit, OnDestroy } from '@angular/core';

interface Review {
  id: number;
  name: string;
  position: string;
  company: string;
  avatar: string;
  text: string;
  rating: number;
}

interface ReviewStat {
  icon: string;
  value: number;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoSlideInterval: any;
  reviews: Review[] = [
    {
      id: 1,
      name: 'Marie Dubois',
      position: 'Directrice Technique',
      company: 'TechnoIndustrie SA',
      avatar: 'assets/img/team_1.jpg',
      text: 'Segus Engineering a dépassé nos attentes avec leur solution d\'automatisation. Leur expertise technique et leur approche collaborative ont transformé notre processus de production.',
      rating: 5
    },
    {
      id: 2,
      name: 'Jean-Pierre Martin',
      position: 'Ingénieur en Chef',
      company: 'AutoMeca Solutions',
      avatar: 'assets/img/team_2.jpg',
      text: 'Un travail d\'ingénierie mécanique exceptionnel. L\'équipe de Segus a livré une conception innovante qui a réduit nos coûts de 30% tout en améliorant les performances.',
      rating: 5
    },
    {
      id: 3,
      name: 'Sophie Laurent',
      position: 'Chef de Projet',
      company: 'Digital Innovations',
      avatar: 'assets/img/team_1.jpg',
      text: 'Le développement de notre application web a été un succès grâce à Segus. Leur maîtrise des technologies modernes et leur respect des délais sont remarquables.',
      rating: 4.5
    },
    {
      id: 4,
      name: 'Ahmed Ben Ali',
      position: 'Responsable R&D',
      company: 'ElectroTech Industries',
      avatar: 'assets/img/team_2.jpg',
      text: 'La conception de notre carte électronique IoT a été réalisée avec une précision remarquable. Segus Engineering maîtrise parfaitement les technologies embarquées.',
      rating: 5
    },
    {
      id: 5,
      name: 'Catherine Moreau',
      position: 'Directrice Opérationnelle',
      company: 'Manufacturing Plus',
      avatar: 'assets/img/team_1.jpg',
      text: 'Leur système de contrôle industriel a révolutionné notre ligne de production. L\'interface SCADA est intuitive et la fiabilité est au rendez-vous.',
      rating: 4.5
    },
    {
      id: 6,
      name: 'Thomas Schneider',
      position: 'Ingénieur Systèmes',
      company: 'Smart Factory GmbH',
      avatar: 'assets/img/team_2.jpg',
      text: 'Segus Engineering nous a accompagnés dans notre transformation digitale avec professionnalisme. Leur expertise en Industrie 4.0 est inégalable.',
      rating: 5
    }
  ];

  reviewStats: ReviewStat[] = [
    {
      icon: 'fas fa-star',
      value: 4.8,
      suffix: '/5',
      label: 'Note Moyenne'
    },
    {
      icon: 'fas fa-thumbs-up',
      value: 98,
      suffix: '%',
      label: 'Clients Satisfaits'
    },
    {
      icon: 'fas fa-redo-alt',
      value: 95,
      suffix: '%',
      label: 'Clients Fidèles'
    },
    {
      icon: 'fas fa-handshake',
      value: 150,
      suffix: '+',
      label: 'Partenariats Actifs'
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide() {
    if (this.currentSlide < this.reviews.length - 1) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0; // Loop back to first slide
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.reviews.length - 1; // Loop to last slide
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.stopAutoSlide();
    this.startAutoSlide(); // Restart auto-slide after manual navigation
  }

  trackByReviewId(index: number, review: Review): number {
    return review.id;
  }

  getStarArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    return Array(fullStars).fill(0);
  }
}
