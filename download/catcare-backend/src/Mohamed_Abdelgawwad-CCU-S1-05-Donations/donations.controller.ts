import { NextFunction, Request, Response } from 'express';
import { AuthorizationError, AuthenticationError, ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { donationsService } from './donations.service.js';
import { CreateDonationInput, DonationListQuery, DonationStatus } from './donations.types.js';

export const donationsController = {
  async submitReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }

      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        throw new ValidationError('Receipt file is required', { field: 'receipt' });
      }

      const payload = req.body as Omit<CreateDonationInput, 'receiptUrl' | 'createdByUserId'>;
      const donation = await donationsService.submitDonation({
        donorName: payload.donorName,
        amount: Number(payload.amount),
        note: payload.note ?? null,
        receiptUrl: `/uploads/receipts/${file.filename}`,
        createdByUserId: req.user.id
      });

      success(res, donation, 201);
    } catch (error) {
      next(error);
    }
  },

  async listForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      if (req.user.role !== 'admin') {
        throw new AuthorizationError('Only admins can review donation submissions');
      }

      const query = req.query as unknown as DonationListQuery;
      const result = await donationsService.listDonations(query);
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      if (req.user.role !== 'admin') {
        throw new AuthorizationError('Only admins can update donation status');
      }

      const id = Number(req.params.id);
      const { status } = req.body as { status: DonationStatus };
      const updated = await donationsService.updateDonationStatus(id, status, req.user.id);
      success(res, updated);
    } catch (error) {
      next(error);
    }
  },

  async publicProgress(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await donationsService.getPublicProgress(env.DONATION_TARGET_GOAL);
      success(res, result);
    } catch (error) {
      next(error);
    }
  }
};
