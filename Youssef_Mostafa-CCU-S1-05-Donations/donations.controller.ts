// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { donationsService } from './donations.service.js';

export const donationsController = {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // authMiddleware attaches req.user — guard here as a safety net
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }

      // Multer puts the uploaded file on req.file — null means no file was sent
      const file = req.file;
      if (!file) {
        throw new ValidationError('A receipt image is required', { field: 'receipt' });
      }

      // amount already passed Zod validation via validate middleware — safe to parse
      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new ValidationError('A valid donation amount is required', { field: 'amount' });
      }

      // Build public URL path — served as static by Express via /uploads
      const imageUrl = `/uploads/donations/${file.filename}`;

      const donation = await donationsService.submitDonation({
        userId: req.user.id, // number — confirmed from AuthUser interface
        amount,
        imageUrl,
      });

      success(res, donation, 201);
    } catch (error) {
      next(error);
    }
  },
};
