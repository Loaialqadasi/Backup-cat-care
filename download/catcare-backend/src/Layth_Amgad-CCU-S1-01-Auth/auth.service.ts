import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';
import { AuthenticationError, ConflictError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { authRepository } from './auth.repository.js';
import { AuthResult, LoginInput, RegisterInput, User } from './auth.types.js';

// sign a JWT with the user's info — token lasts however long JWT_EXPIRES_IN says
const signToken = (user: User): string => {
  const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    env.JWT_SECRET,
    { expiresIn }
  );
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('This email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({
      fullName: input.fullName,
      email,
      passwordHash,
      role: 'student'
    });

    const token = signToken(user);
    return { user, token };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid UTM email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid UTM email or password');
    }

    // never send the password hash back to the client
    const { passwordHash, ...safeUser } = user;
    const token = signToken(safeUser);
    return { user: safeUser, token };
  },

  async getMe(userId: number): Promise<User> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError('Invalid or expired token');
    }
    return user;
  }
};
