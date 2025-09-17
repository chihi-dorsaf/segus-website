import { Injectable } from '@angular/core';
import { Project, Task, SubTask, Employee } from '../models/project.model';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Export project data to Excel format with colors and formatting
   */
  exportProjectsToExcel(projects: Project[], employees: Employee[]): void {
    const workbook = XLSX.utils.book_new();
    const worksheetData = this.prepareSimpleExcelData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // Projet
      { wch: 25 }, // Tâche
      { wch: 30 }, // Sous-tâche
      { wch: 20 }, // ID Section
      { wch: 15 }, // Kilométrage
      ...employees.map(() => ({ wch: 12 })), // Employee columns
      { wch: 15 }, // Statut
      { wch: 12 }  // Complété
    ];
    worksheet['!cols'] = colWidths;

    // Apply comprehensive styling with colors
    this.applyComprehensiveStyling(worksheet, worksheetData, employees.length);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport Projets');
    this.saveWorkbook(workbook, 'Rapport_Projets');
  }

  /**
   * Prepare simplified Excel data with better employee assignment handling
   */
  private prepareSimpleExcelData(projects: Project[], employees: Employee[]): any[][] {
    const headers = ['Projet', 'Tâche', 'Sous-tâche', 'ID Section', 'Kilométrage', ...employees.map(emp => emp.username), 'Statut', 'Complété'];
    const rows: any[][] = [headers];

    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
              const row = [
                project.title,
                task.title,
                subtask.section_name || 'Sous-tâche',
                subtask.section_id || subtask.section_number || '',
                subtask.kilometrage || 0
              ];

              // Add employee assignments with proper checking
              employees.forEach(employee => {
                const isAssigned = this.isEmployeeAssignedToSubtask(subtask, employee);
                row.push(isAssigned ? 'OUI' : 'NON');
              });

              // Add status and completion with color indicators
              const status = subtask.is_completed ? 'TERMINÉ' : 'EN COURS';
              const completed = subtask.is_completed ? 'OUI' : 'NON';
              
              row.push(status);
              row.push(completed);

              rows.push(row);
            });
          } else {
            // Task without subtasks
            const row = [
              project.title,
              task.title,
              'Tâche principale',
              '',
              0
            ];

            // Add employee assignments for task
            employees.forEach(employee => {
              const isAssigned = this.isEmployeeAssignedToTask(task, employee);
              row.push(isAssigned ? 'OUI' : 'NON');
            });

            const status = this.getTaskStatusLabel(task.status);
            const completed = task.status === 'COMPLETED' ? 'OUI' : 'NON';
            
            row.push(status);
            row.push(completed);

            rows.push(row);
          }
        });
      } else {
        // Project without tasks
        const row = [
          project.title,
          'Projet sans tâches',
          '',
          '',
          0
        ];

        // Add employee assignments for project
        employees.forEach(employee => {
          const isAssigned = this.isEmployeeAssignedToProject(project, employee);
          row.push(isAssigned ? 'OUI' : 'NON');
        });

        const status = this.getProjectStatusLabel(project.status);
        const completed = project.status === 'COMPLETED' ? 'OUI' : 'NON';
        
        row.push(status);
        row.push(completed);

        rows.push(row);
      }
    });

    return rows;
  }

  /**
   * Prepare data in Excel format based on the user's requirements
   */
  private prepareExcelData(projects: Project[], employees: Employee[]): any[][] {
    const headers = ['Projet', 'Tâche', 'Sous-tâche', 'ID Sous-tâche', 'Kilométrage', ...employees.map(emp => emp.username), 'Statut', 'Complété'];
    const rows: any[][] = [headers];

    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
              const row = [
                project.title,
                task.title,
                subtask.section_name,
                subtask.section_id,
                subtask.kilometrage || 0
              ];

              // Add employee assignments (Oui/Non for each employee)
              employees.forEach(employee => {
                const isAssigned = subtask.assigned_employees?.some(emp => emp.id === employee.id);
                row.push(isAssigned ? 'OUI' : 'NON');
              });

              // Add status and completion
              row.push(subtask.is_completed ? 'TERMINÉ' : 'EN COURS');
              row.push(subtask.is_completed ? 'OUI' : 'NON');

              rows.push(row);
            });
          } else {
            // Task without subtasks
            const row = [
              project.title,
              task.title,
              '-',
              '-',
              0
            ];

            // Add employee assignments for task
            employees.forEach(employee => {
              const isAssigned = task.assigned_employees?.some(emp => emp.id === employee.id);
              row.push(isAssigned ? 'OUI' : 'NON');
            });

            row.push(this.getTaskStatusLabel(task.status));
            row.push(task.status === 'COMPLETED' ? 'OUI' : 'NON');

            rows.push(row);
          }
        });
      } else {
        // Project without tasks
        const row = [
          project.title,
          '-',
          '-',
          '-',
          0
        ];

        // Add employee assignments for project
        employees.forEach(employee => {
          const isAssigned = project.assigned_employees?.some(emp => emp.id === employee.id);
          row.push(isAssigned ? 'OUI' : 'NON');
        });

        row.push(this.getProjectStatusLabel(project.status));
        row.push(project.status === 'COMPLETED' ? 'OUI' : 'NON');

        rows.push(row);
      }
    });

    return rows;
  }

  /**
   * Save workbook as Excel file
   */
  private saveWorkbook(workbook: XLSX.WorkBook, filename: string): void {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Export detailed project report with color coding information
   */
  exportDetailedProjectReport(projects: Project[], employees: Employee[]): void {
    const workbook = XLSX.utils.book_new();
    const worksheetData = this.prepareSimpleExcelData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for detailed report
    const colWidths = [
      { wch: 30 }, // Projet
      { wch: 25 }, // Tâche
      { wch: 30 }, // Sous-tâche
      { wch: 20 }, // ID Section
      { wch: 15 }, // Kilométrage
      ...employees.map(() => ({ wch: 12 })), // Employee columns
      { wch: 15 }, // Statut
      { wch: 12 }  // Complété
    ];
    worksheet['!cols'] = colWidths;

    // Apply comprehensive styling with colors
    this.applyComprehensiveStyling(worksheet, worksheetData, employees.length);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport Détaillé');
    this.saveWorkbook(workbook, 'Rapport_Détaillé_Projets');
  }

  /**
   * Prepare detailed report data with status indicators
   */
  private prepareDetailedReportData(projects: Project[], employees: Employee[]): any[][] {
    const headers = [
      'Ligne', 'Projet', 'Tâche', 'Sous-tâche', 'ID Section', 'Kilométrage', 'Statut Couleur',
      ...employees.map(emp => emp.username), 'Durée Vide', 'Commentaires'
    ];
    const rows: any[][] = [headers];
    let lineNumber = 1;

    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
              const row = [
                lineNumber++,
                project.title,
                task.title,
                subtask.section_name,
                subtask.section_id,
                subtask.kilometrage || 0,
                subtask.is_completed ? 'VERT' : 'ROUGE' // Color indicator
              ];

              // Add employee assignments
              employees.forEach(employee => {
                const isAssigned = subtask.assigned_employees?.some(emp => emp.id === employee.id);
                row.push(isAssigned ? employee.username.substring(0, 2).toUpperCase() : '');
              });

              // Duration empty indicator
              row.push(subtask.kilometrage && subtask.kilometrage > 0 ? 'NON' : 'OUI');
              
              // Comments
              row.push(subtask.is_completed ? 'Terminé' : 'En cours');

              rows.push(row);
            });
          }
        });
      }
    });

    return rows;
  }

  /**
   * Get project status label in French
   */
  private getProjectStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'ACTIVE': 'ACTIF',
      'COMPLETED': 'TERMINÉ',
      'PAUSED': 'EN PAUSE',
      'CANCELLED': 'ANNULÉ'
    };
    return statusLabels[status] || status;
  }

  /**
   * Get task status label in French
   */
  private getTaskStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'TODO': 'À FAIRE',
      'IN_PROGRESS': 'EN COURS',
      'COMPLETED': 'TERMINÉ',
      'BLOCKED': 'BLOQUÉ'
    };
    return statusLabels[status] || status;
  }

  /**
   * Apply styling to detailed report with color coding
   */
  private applyDetailedReportStyling(worksheet: XLSX.WorkSheet, data: any[][], employeeCount: number): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Style headers
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Apply color coding to status column (column 6 - Statut Couleur)
    for (let row = 1; row <= range.e.r; row++) {
      const statusCellAddress = XLSX.utils.encode_cell({ r: row, c: 6 });
      if (!worksheet[statusCellAddress]) continue;
      
      const statusValue = worksheet[statusCellAddress].v;
      if (statusValue === 'VERT') {
        worksheet[statusCellAddress].s = {
          fill: { fgColor: { rgb: "00FF00" } },
          font: { bold: true }
        };
      } else if (statusValue === 'ROUGE') {
        worksheet[statusCellAddress].s = {
          fill: { fgColor: { rgb: "FF0000" } },
          font: { bold: true, color: { rgb: "FFFFFF" } }
        };
      }
    }
  }

  /**
   * Export project summary report
   */
  exportProjectSummary(projects: Project[]): void {
    const workbook = XLSX.utils.book_new();
    const summaryData = this.prepareSummaryData(projects);
    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths for summary
    const colWidths = [
      { wch: 30 }, // Projet
      { wch: 15 }, // Statut
      { wch: 12 }, // Date Début
      { wch: 12 }, // Date Fin
      { wch: 12 }, // Nb Tâches
      { wch: 15 }, // Nb Sous-tâches
      { wch: 15 }  // Progression %
    ];
    worksheet['!cols'] = colWidths;

    // Apply header styling
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Résumé Projets');
    this.saveWorkbook(workbook, 'Résumé_Projets');
  }

  /**
   * Prepare project summary data
   */
  private prepareSummaryData(projects: Project[]): any[][] {
    const headers = ['Projet', 'Statut', 'Date Début', 'Date Fin', 'Nb Tâches', 'Nb Sous-tâches', 'Progression %'];
    const rows: any[][] = [headers];

    projects.forEach(project => {
      const taskCount = project.tasks?.length || 0;
      const subtaskCount = project.tasks?.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0) || 0;
      const completedSubtasks = project.tasks?.reduce((sum, task) => 
        sum + (task.subtasks?.filter(st => st.is_completed).length || 0), 0) || 0;
      const progression = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;

      const row = [
        project.title,
        this.getProjectStatusLabel(project.status),
        project.start_date,
        project.end_date,
        taskCount,
        subtaskCount,
        `${progression}%`
      ];

      rows.push(row);
    });

    return rows;
  }

  /**
   * Export employee performance report
   */
  exportEmployeePerformanceReport(projects: Project[], employees: Employee[]): void {
    const workbook = XLSX.utils.book_new();
    const performanceData = this.prepareEmployeePerformanceData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(performanceData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Employé
      { wch: 15 }, // Projets Assignés
      { wch: 15 }, // Tâches Assignées
      { wch: 18 }, // Sous-tâches Assignées
      { wch: 15 }, // Tâches Terminées
      { wch: 18 }, // Sous-tâches Terminées
      { wch: 15 }, // Taux Completion %
      { wch: 12 }, // Charge Travail
      { wch: 15 }  // Performance
    ];
    worksheet['!cols'] = colWidths;

    // Apply header styling
    this.applyHeaderStyling(worksheet);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Employés');
    this.saveWorkbook(workbook, 'Rapport_Performance_Employés');
  }

  /**
   * Prepare employee performance data
   */
  private prepareEmployeePerformanceData(projects: Project[], employees: Employee[]): any[][] {
    const headers = [
      'Employé', 'Projets Assignés', 'Tâches Assignées', 'Sous-tâches Assignées',
      'Tâches Terminées', 'Sous-tâches Terminées', 'Taux Completion %', 'Charge Travail', 'Performance'
    ];
    const rows: any[][] = [headers];

    employees.forEach(employee => {
      let assignedProjects = 0;
      let assignedTasks = 0;
      let assignedSubtasks = 0;
      let completedTasks = 0;
      let completedSubtasks = 0;

      projects.forEach(project => {
        // Check project assignment
        if (project.assigned_employees?.some(emp => emp.id === employee.id)) {
          assignedProjects++;
        }

        // Check task assignments
        project.tasks?.forEach(task => {
          if (task.assigned_employees?.some(emp => emp.id === employee.id)) {
            assignedTasks++;
            if (task.status === 'COMPLETED') {
              completedTasks++;
            }

            // Check subtask assignments
            task.subtasks?.forEach(subtask => {
              if (subtask.assigned_employees?.some(emp => emp.id === employee.id)) {
                assignedSubtasks++;
                if (subtask.is_completed) {
                  completedSubtasks++;
                }
              }
            });
          }
        });
      });

      const totalTasks = assignedTasks + assignedSubtasks;
      const totalCompleted = completedTasks + completedSubtasks;
      const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
      
      const workload = assignedProjects > 3 ? 'ÉLEVÉE' : assignedProjects > 1 ? 'MOYENNE' : 'FAIBLE';
      const performance = completionRate >= 80 ? 'EXCELLENTE' : completionRate >= 60 ? 'BONNE' : 'À AMÉLIORER';

      const row = [
        employee.username,
        assignedProjects,
        assignedTasks,
        assignedSubtasks,
        completedTasks,
        completedSubtasks,
        `${completionRate}%`,
        workload,
        performance
      ];

      rows.push(row);
    });

    return rows;
  }

  /**
   * Export comprehensive report with all data
   */
  exportComprehensiveReport(projects: Project[], employees: Employee[]): void {
    const workbook = XLSX.utils.book_new();

    // Add multiple sheets
    this.addProjectsSheet(workbook, projects, employees);
    this.addTasksSheet(workbook, projects, employees);
    this.addEmployeesSheet(workbook, projects, employees);
    this.addSummarySheet(workbook, projects, employees);

    this.saveWorkbook(workbook, 'Rapport_Complet_Segus');
  }

  /**
   * Export time tracking report
   */
  exportTimeTrackingReport(projects: Project[], employees: Employee[]): void {
    const workbook = XLSX.utils.book_new();
    const timeData = this.prepareTimeTrackingData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(timeData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Projet
      { wch: 20 }, // Tâche
      { wch: 25 }, // Sous-tâche
      { wch: 15 }, // Employé
      { wch: 12 }, // Date Début
      { wch: 12 }, // Date Fin
      { wch: 15 }, // Durée Prévue
      { wch: 15 }, // Durée Réelle
      { wch: 12 }, // Statut
      { wch: 15 }  // Retard (jours)
    ];
    worksheet['!cols'] = colWidths;

    this.applyHeaderStyling(worksheet);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suivi Temps');
    this.saveWorkbook(workbook, 'Rapport_Suivi_Temps');
  }

  /**
   * Prepare time tracking data
   */
  private prepareTimeTrackingData(projects: Project[], employees: Employee[]): any[][] {
    const headers = [
      'Projet', 'Tâche', 'Sous-tâche', 'Employé', 'Date Début', 'Date Fin',
      'Durée Prévue', 'Durée Réelle', 'Statut', 'Retard (jours)'
    ];
    const rows: any[][] = [headers];

    projects.forEach(project => {
      project.tasks?.forEach(task => {
        task.subtasks?.forEach(subtask => {
          subtask.assigned_employees?.forEach(employee => {
            const startDate = new Date(task.start_date);
            const endDate = new Date(task.end_date);
            const today = new Date();
            
            const plannedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            const actualDuration = subtask.is_completed ? plannedDuration : 
              Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            
            const delay = !subtask.is_completed && today > endDate ? 
              Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 3600 * 24)) : 0;

            const row = [
              project.title,
              task.title,
              subtask.section_name,
              employee.username,
              task.start_date,
              task.end_date,
              `${plannedDuration} jours`,
              `${actualDuration} jours`,
              subtask.is_completed ? 'TERMINÉ' : 'EN COURS',
              delay > 0 ? `${delay} jours` : 'À temps'
            ];

            rows.push(row);
          });
        });
      });
    });

    return rows;
  }

  /**
   * Add projects sheet to workbook
   */
  private addProjectsSheet(workbook: XLSX.WorkBook, projects: Project[], employees: Employee[]): void {
    const data = this.prepareExcelData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    this.applyHeaderStyling(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projets');
  }

  /**
   * Add tasks sheet to workbook
   */
  private addTasksSheet(workbook: XLSX.WorkBook, projects: Project[], employees: Employee[]): void {
    const data = this.prepareDetailedReportData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    this.applyDetailedReportStyling(worksheet, data, employees.length);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tâches');
  }

  /**
   * Add employees sheet to workbook
   */
  private addEmployeesSheet(workbook: XLSX.WorkBook, projects: Project[], employees: Employee[]): void {
    const data = this.prepareEmployeePerformanceData(projects, employees);
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    this.applyHeaderStyling(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employés');
  }

  /**
   * Add summary sheet to workbook
   */
  private addSummarySheet(workbook: XLSX.WorkBook, projects: Project[], employees: Employee[]): void {
    const data = this.prepareSummaryData(projects);
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    this.applyHeaderStyling(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Résumé');
  }

  /**
   * Apply header styling to worksheet
   */
  private applyHeaderStyling(worksheet: XLSX.WorkSheet): void {
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }

  /**
   * Apply comprehensive styling with colors to worksheet
   */
  private applyComprehensiveStyling(worksheet: XLSX.WorkSheet, data: any[][], employeeCount: number): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply header styling
    this.applyHeaderStyling(worksheet);

    // Apply row styling with colors
    for (let row = 1; row <= range.e.r; row++) {
      // Status column (second to last column)
      const statusColIndex = range.e.c - 1;
      const statusCellAddress = XLSX.utils.encode_cell({ r: row, c: statusColIndex });
      
      if (worksheet[statusCellAddress]) {
        const statusValue = worksheet[statusCellAddress].v;
        
        if (statusValue === 'TERMINÉ' || statusValue === 'COMPLETED') {
          // Green background for completed items
          worksheet[statusCellAddress].s = {
            fill: { fgColor: { rgb: "00FF00" } },
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center" }
          };
        } else if (statusValue === 'EN COURS' || statusValue === 'IN_PROGRESS') {
          // Red background for in-progress items
          worksheet[statusCellAddress].s = {
            fill: { fgColor: { rgb: "FF0000" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center" }
          };
        }
      }

      // Completed column (last column)
      const completedColIndex = range.e.c;
      const completedCellAddress = XLSX.utils.encode_cell({ r: row, c: completedColIndex });
      
      if (worksheet[completedCellAddress]) {
        const completedValue = worksheet[completedCellAddress].v;
        
        if (completedValue === 'OUI') {
          // Green background for completed
          worksheet[completedCellAddress].s = {
            fill: { fgColor: { rgb: "00FF00" } },
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center" }
          };
        } else if (completedValue === 'NON') {
          // Light red background for not completed
          worksheet[completedCellAddress].s = {
            fill: { fgColor: { rgb: "FFB3B3" } },
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center" }
          };
        }
      }

      // Employee assignment columns
      const employeeStartCol = 5; // After Projet, Tâche, Sous-tâche, ID Section, Kilométrage
      for (let empCol = employeeStartCol; empCol < employeeStartCol + employeeCount; empCol++) {
        const empCellAddress = XLSX.utils.encode_cell({ r: row, c: empCol });
        
        if (worksheet[empCellAddress]) {
          const empValue = worksheet[empCellAddress].v;
          
          if (empValue === 'OUI') {
            // Light blue background for assigned employees
            worksheet[empCellAddress].s = {
              fill: { fgColor: { rgb: "ADD8E6" } },
              font: { bold: true, color: { rgb: "000000" } },
              alignment: { horizontal: "center" }
            };
          } else {
            // Light gray for not assigned
            worksheet[empCellAddress].s = {
              fill: { fgColor: { rgb: "F0F0F0" } },
              alignment: { horizontal: "center" }
            };
          }
        }
      }
    }
  }

  /**
   * Check if employee is assigned to subtask
   */
  private isEmployeeAssignedToSubtask(subtask: SubTask, employee: Employee): boolean {
    return subtask.assigned_employees?.some(emp => emp.id === employee.id) || false;
  }

  /**
   * Check if employee is assigned to task
   */
  private isEmployeeAssignedToTask(task: Task, employee: Employee): boolean {
    return task.assigned_employees?.some(emp => emp.id === employee.id) || false;
  }

  /**
   * Check if employee is assigned to project
   */
  private isEmployeeAssignedToProject(project: Project, employee: Employee): boolean {
    return project.assigned_employees?.some(emp => emp.id === employee.id) || false;
  }
}
