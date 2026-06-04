export interface UserRole {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  is_active: number;
  created_at: string;
  roles: UserRole[];
}