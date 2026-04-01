import {UserRole} from './user-role.enum';
import {StudyCycle} from './study-cycle.enum';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  user_type_id: number;
  name: string;
  is_admin?: boolean; // For teachers
  study_cycle?: StudyCycle; // For students
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

