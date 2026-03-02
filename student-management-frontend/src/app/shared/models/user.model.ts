import { UserRole } from './user-role.enum';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  user_type_id: number;
  name: string;
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

