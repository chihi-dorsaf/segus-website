import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as $ from 'jquery';
declare var jQuery: any;

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements AfterViewInit {
  @ViewChild('reviewsSlider') reviewsSlider!: ElementRef;

  ngAfterViewInit() {
    if (this.reviewsSlider && this.reviewsSlider.nativeElement) {
      jQuery(this.reviewsSlider.nativeElement).owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000
      });
    } else {
      console.error('Reviews slider element not found');
    }
  }
}
