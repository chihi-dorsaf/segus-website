import { Component, AfterViewInit } from '@angular/core';
import * as $ from 'jquery';
import 'owl.carousel/dist/owl.carousel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  ngAfterViewInit() {
    // Pas d'initialisation de sliders ici, délégué aux composants
    console.log('AppComponent initialized, jQuery available:', typeof $ === 'function');
  }
}
