import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { DatabaseError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { User, UserWithPassword, CreateUserInput } from './auth.types.js';

interface UserRow extends RowDataPacket {
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
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUserWithPassword(rows[0]);
  },

  async findById(id: number): Promise<User | null> {
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUser(rows[0]);
  },

  async create(input: CreateUserInput): Promise<User> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [input.fullName, input.email, input.passwordHash, input.role]
    );
    const user = await this.findById(result.insertId);
    if (!user) {
      throw new DatabaseError('Failed to create user');
    }
    return user;
  }
};
