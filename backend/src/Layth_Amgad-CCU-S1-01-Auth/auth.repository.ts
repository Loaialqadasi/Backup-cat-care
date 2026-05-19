import { DatabaseError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { User, UserWithPassword, CreateUserInput } from './auth.types.js';

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// DB rows use snake_case, our app uses camelCase
const mapUser = (row: UserRow): User => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role as User['role'],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapUserWithPassword = (row: UserRow): UserWithPassword => ({
  ...mapUser(row),
  passwordHash: row.password_hash
});

export const authRepository = {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const { rows } = await db.query<UserRow>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUserWithPassword(rows[0]);
  },

  async findById(id: number): Promise<User | null> {
    const { rows } = await db.query<UserRow>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUser(rows[0]);
  },

  async create(input: CreateUserInput): Promise<User> {
    const { rows } = await db.query<UserRow>(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, password_hash, role, created_at, updated_at',
      [input.fullName, input.email, input.passwordHash, input.role]
    );
    return mapUser(rows[0]);
  }
};
