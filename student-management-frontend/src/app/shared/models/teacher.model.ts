export interface Teacher {
  id: number;
  name: string;
  email: string;
  password?: string; // Optional, only for create/update
  is_admin?: boolean;
}
