import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  private slideInterval: any;
  
  slides = [
    {
      title: 'Solutions d\'Ingénierie Innovantes',
      subtitle: 'Nous concevons et développons des solutions techniques de pointe pour transformer vos idées en réalité'
    },
    {
      title: 'Excellence Technique & Innovation',
      subtitle: 'Notre expertise couvre tous les domaines de l\'ingénierie moderne avec des technologies de dernière génération'
    }
  ];

  constructor() {}

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  private startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 8000); // Change slide every 8 seconds
  }

  private stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}
