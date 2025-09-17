import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { EmployeeFrontofficeService } from '../../services/employee-frontoffice.service';
import { GamificationService } from '../../services/gamification.service';
import { TaskWithDetails, SubTask as ProjectSubTask, UpdateSubTask } from '../../models/project.model';
import { Subscription } from 'rxjs';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  project: {
    id: number;
    title: string;
  };
  subtasks?: SubTask[];
}

interface SubTask {
  id: number;
  section_name: string;
  section_number: number;
  section_id: string;
  kilometrage?: number;
  is_completed: boolean;
  task: number;
  assigned_employees: any[];
}

@Component({
  selector: 'app-employee-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-tasks.component.html',
  styleUrls: ['./employee-tasks.component.css']
})
export class EmployeeTasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  subtasks: SubTask[] = [];
  isLoading = true;
  error: string | null = null;
  selectedStatus = 'all';
  selectedCompletionStatus: string = 'all';
  filteredSubtasks: any[] = [];
  viewMode: 'list' | 'kanban' = 'list';
  draggedSubtask: any = null;
  isSyncing = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private employeeService: EmployeeFrontofficeService,
    private taskService: TaskService,
    private gamificationService: GamificationService
  ) {}

  ngOnInit(): void {
    // Ne plus charger les tâches principales pour les employés
    this.loadSubtasks();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTasks(): void {
    this.isLoading = true;
    const taskSub = this.employeeService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des tâches:', error);
        this.error = 'Erreur lors du chargement des tâches';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(taskSub);
  }

  loadSubtasks(): void {
    const subtaskSub = this.taskService.getMySubtasks().subscribe({
      next: (subtasks: any) => {
        this.subtasks = subtasks;
        this.filteredSubtasks = subtasks;
        this.isLoading = false;
        console.log('Sous-tâches chargées:', subtasks);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des sous-tâches:', error);
        this.error = 'Erreur lors du chargement des sous-tâches';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(subtaskSub);
  }

  getFilteredTasks(): Task[] {
    if (this.selectedStatus === 'all') {
      return this.tasks;
    }
    return this.tasks.filter(task => task.status.toLowerCase() === this.selectedStatus);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'todo': return 'secondary';
      case 'blocked': return 'danger';
      default: return 'secondary';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  }

  onTaskStatusChange(event: Event, taskId: number): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateTaskStatus(taskId, target.value);
    }
  }

  updateTaskStatus(taskId: number, newStatus: string): void {
    this.employeeService.updateTaskStatus(taskId, newStatus).subscribe({
      next: (response: any) => {
        console.log('Task status updated successfully');
        // Refresh tasks list
        this.loadTasks();
      },
      error: (error: any) => {
        console.error('Error updating task status:', error);
      }
    });
  }

  filterSubtasks(): void {
    if (this.selectedCompletionStatus === 'all') {
      this.filteredSubtasks = this.subtasks;
    } else if (this.selectedCompletionStatus === 'completed') {
      this.filteredSubtasks = this.subtasks.filter(subtask => subtask.is_completed);
    } else if (this.selectedCompletionStatus === 'pending') {
      this.filteredSubtasks = this.subtasks.filter(subtask => !subtask.is_completed);
    }
  }

  getFilteredSubtasks() {
    return this.filteredSubtasks;
  }

  getSubtasksByStatus(status: string): any[] {
    if (!this.subtasks) return [];
    
    switch (status) {
      case 'backlog':
        return this.subtasks.filter((subtask: any) => !subtask.is_completed && (!subtask.status || subtask.status === null));
      case 'todo':
        return this.subtasks.filter((subtask: any) => !subtask.is_completed && subtask.status === 'TODO');
      case 'in_progress':
        return this.subtasks.filter((subtask: any) => !subtask.is_completed && subtask.status === 'IN_PROGRESS');
      case 'completed':
        return this.subtasks.filter((subtask: any) => subtask.is_completed);
      default:
        return [];
    }
  }

  onDragStart(event: DragEvent, subtask: any): void {
    this.draggedSubtask = subtask;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', subtask.id.toString());
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();
    
    if (!this.draggedSubtask) return;

    const subtaskId = this.draggedSubtask.id;
    this.updateSubtaskStatus(subtaskId, newStatus);
    this.draggedSubtask = null;
  }

  private updateSubtaskStatus(subtaskId: number, newStatus: string): void {
    const subtask: any = this.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    // Mettre à jour le statut local
    switch (newStatus) {
      case 'backlog':
        subtask.status = null;
        subtask.is_completed = false;
        break;
      case 'todo':
        subtask.status = 'TODO';
        subtask.is_completed = false;
        break;
      case 'in_progress':
        subtask.status = 'IN_PROGRESS';
        subtask.is_completed = false;
        break;
      case 'completed':
        subtask.is_completed = true;
        // Utiliser l'endpoint gamification pour déclencher le calcul des étoiles
        this.taskService.markSubtaskCompleted(subtaskId).subscribe({
          next: (response: any) => {
            console.log('Sous-tâche terminée avec calcul des étoiles:', response);
          },
          error: (error: any) => {
            console.error('Erreur lors du marquage gamification:', error);
          }
        });
        return; // Sortir tôt pour éviter l'appel standard
    }

    // Appeler l'API standard pour les autres statuts
    this.employeeService.updateSubtaskStatus(subtaskId, {
      status: subtask.status,
      is_completed: subtask.is_completed
    }).subscribe({
      next: (response: any) => {
        console.log('Statut de la sous-tâche mis à jour:', response);
      },
      error: (error: any) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        // Revertir les changements en cas d'erreur
        this.loadSubtasks();
      }
    });
  }

  toggleSubtaskCompletion(subtaskId: number): void {
    const subtask = this.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      // Utiliser l'endpoint gamification pour déclencher le calcul des étoiles
      const shouldComplete = !subtask.is_completed;
      const request$ = shouldComplete
        ? this.taskService.markSubtaskCompleted(subtaskId)
        : this.taskService.markSubtaskUncompleted(subtaskId);
      
      const updateSub = request$.subscribe({
        next: () => {
          this.loadSubtasks(); // Recharger les sous-tâches
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour de la sous-tâche:', error);
        }
      });
      this.subscriptions.push(updateSub);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  syncGamificationStats(): void {
    this.isSyncing = true;
    
    const syncSub = this.gamificationService.syncProjectSubtasks().subscribe({
      next: (response) => {
        console.log('Synchronisation terminée:', response);
        this.isSyncing = false;
        // Optionnel: afficher un message de succès
        alert('Étoiles calculées avec succès !');
      },
      error: (error) => {
        console.error('Erreur lors de la synchronisation:', error);
        this.isSyncing = false;
        alert('Erreur lors du calcul des étoiles. Veuillez réessayer.');
      }
    });
    
    this.subscriptions.push(syncSub);
  }
}
