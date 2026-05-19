import { UserRole } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface AuthResult {
  user: User;
  token: string;
}
