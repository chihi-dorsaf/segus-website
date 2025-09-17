import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { EmployeeService } from '../../services/employee.service';
import { ExcelExportService } from '../../services/excel-export.service';
import { Project, Employee } from '../../models/project.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
  activeSection: string = 'reports';
  projects: Project[] = [];
  employees: Employee[] = [];
  loading = false;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    
    // Load projects
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        this.projects = response.results || response;
        this.checkDataLoaded();
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.checkDataLoaded();
      }
    });

    // Load employees
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.results || response;
        this.checkDataLoaded();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.checkDataLoaded();
      }
    });
  }

  private checkDataLoaded(): void {
    if (this.projects.length >= 0 && this.employees.length >= 0) {
      this.loading = false;
    }
  }

  // Excel Export Methods
  generateTaskReport(): void {
    this.excelExportService.exportDetailedProjectReport(this.projects, this.employees);
  }

  generateProjectReport(): void {
    this.excelExportService.exportProjectsToExcel(this.projects, this.employees);
  }

  generateEmployeeReport(): void {
    this.excelExportService.exportEmployeePerformanceReport(this.projects, this.employees);
  }

  generateProjectSummary(): void {
    this.excelExportService.exportProjectSummary(this.projects);
  }

  generateCompleteReport(): void {
    this.excelExportService.exportComprehensiveReport(this.projects, this.employees);
  }

  generateSimpleReport(): void {
    this.excelExportService.exportProjectsToExcel(this.projects, this.employees);
  }

  generateTimeTrackingReport(): void {
    this.excelExportService.exportTimeTrackingReport(this.projects, this.employees);
  }
}
