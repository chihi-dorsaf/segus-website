import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as $ from 'jquery';
declare var jQuery: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('slider') slider!: ElementRef;

  ngAfterViewInit() {
    if (this.slider && this.slider.nativeElement) {
      jQuery(this.slider.nativeElement).owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 3000
      });
    } else {
      console.error('Home slider element not found');
    }
  }
}
