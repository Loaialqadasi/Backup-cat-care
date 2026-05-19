// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';

// run this after authMiddleware — it already put req.user on the request
// if the user isn't an admin, we stop them here before they touch anything
export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};
