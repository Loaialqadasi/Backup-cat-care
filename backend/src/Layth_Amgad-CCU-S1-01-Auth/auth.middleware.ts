import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';
import { AuthenticationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { AuthUser, JwtPayload } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

// make req.user available on every authenticated request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// pull the JWT from Authorization header, verify it, attach user to the request
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid token'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (error) {
    next(new AuthenticationError('Missing or invalid token'));
  }
};
