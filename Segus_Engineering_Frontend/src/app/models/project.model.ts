

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}

export enum Priority {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}
export interface UpdateSubTask {
  section_name?: string;
  section_number?: string;
  section_id?: string;
  kilometrage?: number;
  assigned_employee_ids?: number[];
  is_completed?: boolean;
  status?: TaskStatus | null;
}


// Labels pour l'affichage
export const PROJECT_STATUS_LABELS = {
  [ProjectStatus.ACTIVE]: 'Actif',
  [ProjectStatus.COMPLETED]: 'Terminé',
  [ProjectStatus.PAUSED]: 'En pause',
  [ProjectStatus.CANCELLED]: 'Annulé'
};

export const TASK_STATUS_LABELS = {
  [TaskStatus.TODO]: 'À faire',
  [TaskStatus.IN_PROGRESS]: 'En cours',
  [TaskStatus.COMPLETED]: 'Terminé',
  [TaskStatus.BLOCKED]: 'Bloqué'
};

export const PRIORITY_LABELS = {
  [Priority.VERY_LOW]: 'Très basse',
  [Priority.LOW]: 'Basse',
  [Priority.MEDIUM]: 'Moyenne',
  [Priority.HIGH]: 'Haute',
  [Priority.VERY_HIGH]: 'Très haute'
};

// src/app/models/project.model.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYE = 'EMPLOYE',  // Updated to match backend
}

export interface UserSimple {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYE';  // Updated to match backend
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  full_name?: string;  // Added to match UserSimpleSerializer
}

// Interface pour les employés avec détails utilisateur (alignée avec employee.model.ts)
export interface EmployeeWithUser {
  id?: number;
  user: number;
  matricule: string;
  position: string;
  created_at?: string;
  user_details: UserSimple;
}

// Interfaces de base
export interface User extends UserSimple {
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee extends User {
  position?: string;
  phone?: string;
  hire_date?: string;
}

// Interface pour les sous-tâches (correspondant au backend)
export interface SubTask {
  id: number;
  section_name: string;
  section_number: string;
  section_id: string;
  kilometrage: number;
  is_completed: boolean;
  completed_at: string | null;
  status?: TaskStatus | null;
  task: number;
  assigned_employees: UserSimple[];
  created_by: UserSimple;
  created_at: string;
  updated_at: string;
}

// Interface pour les tâches (correspondant au backend)
export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  start_date: string;
  end_date: string;
  project: number;
  assigned_employees: UserSimple[];
  created_by: UserSimple;
  subtasks: SubTask[];
  progress_percentage: number;
  total_subtasks: number;
  completed_subtasks: number;
  created_at: string;
  updated_at: string;
}

// Interface pour les projets (correspondant au backend)
export interface Project {
  id: number;
  name: string;
  title: string;
  description: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  assigned_employees: UserSimple[];
  created_by: UserSimple;
  tasks: Task[];
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

// ...
// Interfaces étendues avec détails
export interface ProjectWithDetails extends Project {
  // Toutes les propriétés sont déjà dans Project de base
}

export interface TaskWithDetails extends Task {
  // Toutes les propriétés sont déjà dans Task de base
}

// Interfaces pour la création (correspondant aux serializers Django)
export interface CreateProject {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: ProjectStatus;
  assigned_employee_ids?: number[];
}

export interface CreateTask {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: TaskStatus;
  priority?: Priority;
  project: number;
  estimated_hours?: number;
  assigned_employee_ids?: number[];
}

export interface CreateSubTask {
  section_name: string;
  section_number: string;
  section_id: string;
  kilometrage: number;
  task: number;
  assigned_employee_ids?: number[];
}

// Interfaces pour la mise à jour
export interface UpdateProject {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  assigned_employee_ids?: number[];
}

export interface UpdateTask {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: TaskStatus;
  priority?: Priority;
  estimated_hours?: number;
  assigned_employee_ids?: number[];
}

export interface UpdateSubTaskStatus {
  section_name?: string;
  section_number?: string;
  section_id?: string;
  kilometrage?: number;
  assigned_employee_ids?: number[];
  is_completed?: boolean;
  status?: TaskStatus | null;
}

// Interfaces pour les filtres
export interface ProjectFilter {
  status?: ProjectStatus;
  search?: string;
  employee?: number;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  project?: number;
  employee?: number;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
}

// Interface pour les statistiques
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  cancelledProjects: number;
  totalEmployees: number;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  totalEmployees: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksBlocked: number;
}

// Interface pour la pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fonctions utilitaires mises à jour
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return '#6b7280'; // gray
    case TaskStatus.IN_PROGRESS:
      return '#3b82f6'; // blue
    case TaskStatus.COMPLETED:
      return '#10b981'; // green
    case TaskStatus.BLOCKED:
      return '#ef4444'; // red
    default:
      return '#6b7280';
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case Priority.VERY_LOW:
      return '#64748b'; // slate
    case Priority.LOW:
      return '#06b6d4'; // cyan
    case Priority.MEDIUM:
      return '#eab308'; // yellow
    case Priority.HIGH:
      return '#f97316'; // orange
    case Priority.VERY_HIGH:
      return '#dc2626'; // red
    default:
      return '#64748b';
  }
}

export function calculateTaskProgress(task: TaskWithDetails): number {
  return task.progress_percentage || 0;
}

export function isTaskOverdue(task: Task): boolean {
  const today = new Date();
  const endDate = new Date(task.end_date);
  return endDate < today && task.status !== TaskStatus.COMPLETED;
}

export function isTaskDueSoon(task: Task, daysThreshold: number = 3): boolean {
  const today = new Date();
  const endDate = new Date(task.end_date);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= daysThreshold && diffDays >= 0 && task.status !== TaskStatus.COMPLETED;
}

