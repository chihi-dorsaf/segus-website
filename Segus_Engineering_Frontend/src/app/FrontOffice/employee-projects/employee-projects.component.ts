import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeFrontofficeService } from '../../services/employee-frontoffice.service';

@Component({
  selector: 'app-employee-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-projects.component.html',
  styleUrls: ['./employee-projects.component.css']
})
export class EmployeeProjectsComponent implements OnInit {
  projects: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private employeeService: EmployeeFrontofficeService) {}

  ngOnInit(): void {
    this.employeeService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des projets';
        this.loading = false;
      }
    });
  }
}
