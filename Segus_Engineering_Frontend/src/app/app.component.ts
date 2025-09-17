import { Component } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isAdminRoute: boolean = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
    });
  }

  onLogout() {
    console.log('Déconnexion...');
  }
}
