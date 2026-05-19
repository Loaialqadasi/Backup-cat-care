export type UserRole = 'student' | 'volunteer' | 'admin';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload extends AuthUser {}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
