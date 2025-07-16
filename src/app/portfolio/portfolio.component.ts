import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as $ from 'jquery';

// Déclare jQuery pour éviter les erreurs de typage (optionnel si @types/jquery est installé)
declare var jQuery: any;

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements AfterViewInit {
  @ViewChild('portfolioSlider') portfolioSlider!: ElementRef;

  ngAfterViewInit() {
    console.log('jQuery available:', typeof jQuery === 'function', 'Slider:', this.portfolioSlider);
    if (this.portfolioSlider && this.portfolioSlider.nativeElement) {
      jQuery(this.portfolioSlider.nativeElement).owlCarousel({
        items: 3,
        loop: true,
        margin: 10,
        responsive: {
          0: { items: 1 },
          600: { items: 2 },
          1000: { items: 3 }
        },
        onInitialized: function () {
          console.log('Portfolio slider initialized');
        },
        onTranslate: function () {
          console.log('Portfolio slider moving');
        }
      });
    } else {
      console.error('Portfolio slider element not found');
    }
  }
}
