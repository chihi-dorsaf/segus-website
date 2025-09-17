// employee.model.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface UserSimple {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
}

// Add the missing Employee interface
export interface Employee {
  id?: number;
  user: number;
  matricule: string;
  position: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  salary?: number;
  profile_photo?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_details?: UserSimple;
  email?: string;
}

export interface EmployeeWithUser {
  id?: number;
  user: number;
  matricule: string;
  position: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  salary?: number;
  profile_photo?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_details: UserSimple;
  email?: string;
}

export interface EmployeeFilter {
  role?: UserRole;
  search?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Add the missing ApiErrorResponse interface
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: { [key: string]: string[] };
}
