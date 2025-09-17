import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnInit {
  isEmployeeRoute = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Détecter si on est sur une route employé
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isEmployeeRoute = event.url.includes('/frontoffice') || event.url.includes('/backoffice');
        }
      });
    
    // Vérification initiale
    this.isEmployeeRoute = this.router.url.includes('/frontoffice') || this.router.url.includes('/backoffice');
  }
}
