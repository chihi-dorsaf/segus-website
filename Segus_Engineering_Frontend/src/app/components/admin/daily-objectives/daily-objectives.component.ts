// src/app/components/admin/daily-objectives/daily-objectives.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GamificationService } from '../../../services/gamification.service';
import { EmployeeService } from '../../../services/employee.service';
import { DailyObjective } from '../../../models/gamification.model';
import { Employee } from '../../../models/employee.model';
import { DialogService } from '../../../services/dialog.service';
import { UiNotificationService } from '../../../services/ui-notification.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-daily-objectives',
  templateUrl: './daily-objectives.component.html',
  styleUrls: ['./daily-objectives.component.scss']
})
export class DailyObjectivesComponent implements OnInit {
  objectives: DailyObjective[] = [];
  employees: Employee[] = [];
  objectiveForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentObjectiveId: number | null = null;
  displayedColumns: string[] = ['employee', 'date', 'subtask_count', 'planned_hours', 'actions'];
  selectedDate = new Date();

  constructor(
    private gamificationService: GamificationService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private notificationService: UiNotificationService
  ) {
    this.objectiveForm = this.fb.group({
      employee: ['', Validators.required],
      date: [new Date(), Validators.required],
      subtask_count: ['', [Validators.required, Validators.min(1)]],
      planned_hours: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadObjectives();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(
      (data) => {
        this.employees = data;
      },
      (error) => {
        this.notificationService.error('Erreur lors du chargement des employés');
        console.error('Error loading employees:', error);
      }
    );
  }

  loadObjectives(): void {
    this.isLoading = true;
    const formattedDate = formatDate(this.selectedDate, 'yyyy-MM-dd', 'en-US');
    
    this.gamificationService.getDailyObjectives({ date: formattedDate }).subscribe(
      (data) => {
        this.objectives = data;
        this.isLoading = false;
      },
      (error) => {
        this.notificationService.error('Erreur lors du chargement des objectifs');
        console.error('Error loading objectives:', error);
        this.isLoading = false;
      }
    );
  }

  onDateChange(): void {
    this.loadObjectives();
  }

  onSubmit(): void {
    if (this.objectiveForm.invalid) {
      return;
    }

    const formValue = this.objectiveForm.value;
    const objective = {
      employee: formValue.employee,
      date: formatDate(formValue.date, 'yyyy-MM-dd', 'en-US'),
      subtask_count: formValue.subtask_count,
      planned_hours: formValue.planned_hours
    };

    this.isLoading = true;

    if (this.isEditing && this.currentObjectiveId) {
      this.gamificationService.updateDailyObjective(this.currentObjectiveId, {
        subtask_count: objective.subtask_count,
        planned_hours: objective.planned_hours
      }).subscribe(
        (data) => {
          this.notificationService.success('Objectif mis à jour avec succès');
          this.resetForm();
          this.loadObjectives();
        },
        (error) => {
          this.notificationService.error('Erreur lors de la mise à jour de l\'objectif');
          console.error('Error updating objective:', error);
          this.isLoading = false;
        }
      );
    } else {
      this.gamificationService.createDailyObjective(objective).subscribe(
        (data) => {
          this.notificationService.success('Objectif créé avec succès');
          this.resetForm();
          this.loadObjectives();
        },
        (error) => {
          this.notificationService.error('Erreur lors de la création de l\'objectif');
          console.error('Error creating objective:', error);
          this.isLoading = false;
        }
      );
    }
  }

  editObjective(objective: DailyObjective): void {
    this.isEditing = true;
    this.currentObjectiveId = objective.id!;
    
    this.objectiveForm.patchValue({
      employee: objective.employee,
      date: new Date(objective.date),
      subtask_count: objective.subtask_count,
      planned_hours: objective.planned_hours
    });
    
    // Disable employee and date fields when editing
    this.objectiveForm.get('employee')?.disable();
    this.objectiveForm.get('date')?.disable();
  }

  deleteObjective(objective: DailyObjective): void {
    this.dialogService.confirm({
      title: 'Confirmation de suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cet objectif ?'
    }).subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.gamificationService.deleteDailyObjective(objective.id!).subscribe(
          () => {
            this.notificationService.success('Objectif supprimé avec succès');
            this.loadObjectives();
          },
          (error) => {
            this.notificationService.error('Erreur lors de la suppression de l\'objectif');
            console.error('Error deleting objective:', error);
            this.isLoading = false;
          }
        );
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentObjectiveId = null;
    this.objectiveForm.reset({
      date: new Date(),
    });
    this.objectiveForm.get('employee')?.enable();
    this.objectiveForm.get('date')?.enable();
    this.isLoading = false;
  }

  getEmployeeName(id: number): string {
    const employee = this.employees.find(e => e.id === id);
    return employee ? `${employee.user.first_name} ${employee.user.last_name}` : 'Inconnu';
  }
}