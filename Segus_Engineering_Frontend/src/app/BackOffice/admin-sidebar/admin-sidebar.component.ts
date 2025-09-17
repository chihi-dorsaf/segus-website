import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Confirmé

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterModule], // Confirmé
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent {}
