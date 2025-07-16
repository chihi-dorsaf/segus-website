import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
 isDarkMode = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.verifierRouteActive();
      }
    });
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  basculerModeSombre() {
    this.isDarkMode = !this.isDarkMode;
  }

  verifierRouteActive() {
    const liens = document.querySelectorAll('.nav-link');
    liens.forEach(lien => {
      const routerLink = (lien as HTMLAnchorElement).getAttribute('routerLink');
      if (this.isActive(routerLink || '')) {
        lien.classList.add('active');
      } else {
        lien.classList.remove('active');
      }
    });
  }

}
