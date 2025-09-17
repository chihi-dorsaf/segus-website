import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../admin-footer/admin-footer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
    AdminFooterComponent,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      
      <app-admin-sidebar></app-admin-sidebar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  onLogout() {
    console.log('Déconnexion...');
  }
}
