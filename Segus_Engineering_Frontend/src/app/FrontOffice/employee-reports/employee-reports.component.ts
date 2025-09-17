import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReportData {
  period: string;
  tasksCompleted: number;
  totalTasks: number;
  hoursWorked: number;
  productivity: number;
  projects: ProjectReport[];
}

interface ProjectReport {
  name: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  status: string;
}

@Component({
  selector: 'app-employee-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-reports.component.html',
  styleUrls: ['./employee-reports.component.css']
})
export class EmployeeReportsComponent implements OnInit {
  selectedPeriod = 'week';
  reportData: ReportData | null = null;
  isLoading = false;
  
  periods = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' },
    { value: 'year', label: 'Cette année' }
  ];

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.isLoading = true;
    
    // Simulation de données - à remplacer par un appel API
    setTimeout(() => {
      this.reportData = {
        period: this.selectedPeriod,
        tasksCompleted: 28,
        totalTasks: 35,
        hoursWorked: 42.5,
        productivity: 85,
        projects: [
          {
            name: 'Projet Alpha',
            progress: 85,
            tasksCompleted: 12,
            totalTasks: 15,
            status: 'in_progress'
          },
          {
            name: 'Projet Beta',
            progress: 100,
            tasksCompleted: 8,
            totalTasks: 8,
            status: 'completed'
          },
          {
            name: 'Projet Gamma',
            progress: 45,
            tasksCompleted: 8,
            totalTasks: 12,
            status: 'in_progress'
          }
        ]
      };
      this.isLoading = false;
    }, 1000);
  }

  onPeriodChange(): void {
    this.loadReportData();
  }

  getCompletionRate(): number {
    if (!this.reportData) return 0;
    return Math.round((this.reportData.tasksCompleted / this.reportData.totalTasks) * 100);
  }

  getProductivityColor(): string {
    if (!this.reportData) return 'secondary';
    const productivity = this.reportData.productivity;
    if (productivity >= 90) return 'success';
    if (productivity >= 70) return 'info';
    if (productivity >= 50) return 'warning';
    return 'danger';
  }

  getProjectStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'blocked': return 'danger';
      default: return 'secondary';
    }
  }

  getProjectStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'blocked': return 'Bloqué';
      default: return 'En attente';
    }
  }

  exportReport(): void {
    console.log('Export du rapport pour la période:', this.selectedPeriod);
    // TODO: Implémenter l'export PDF/Excel
  }

  printReport(): void {
    window.print();
  }
}
