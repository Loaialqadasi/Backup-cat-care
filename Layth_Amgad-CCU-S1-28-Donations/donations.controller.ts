// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { donationsService } from './donations.service.js';
import { ReviewDonationInput, SubmitDonationInput } from './donations.types.js';

export const donationsController = {

  // POST /api/donations — donor submits their receipt
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;

      // multer already enforces file presence via the route, but belt-and-suspenders here
      if (!file) {
        throw new ValidationError('Receipt image is required', { field: 'receipt' });
      }

      const body = req.body as SubmitDonationInput;
      const receiptUrl = `/uploads/receipts/${file.filename}`;

      const donation = await donationsService.submitDonation(body, receiptUrl);
      success(res, donation, 201);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/donations/pending — admin sees all pending receipts
  // req.user guaranteed by authMiddleware + adminMiddleware
  async getPending(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pending = await donationsService.getPendingDonations();
      success(res, pending);
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/donations/:id/review — admin approves or rejects
  // req.user guaranteed by authMiddleware + adminMiddleware
  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const donationId = Number(req.params.id);
      if (!Number.isFinite(donationId)) {
        throw new ValidationError('Invalid donation ID');
      }
      const { status, rejectionReason } = req.body as ReviewDonationInput;

      const updated = await donationsService.reviewDonation(donationId, status, req.user!.id, rejectionReason);
      success(res, updated);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/donations/progress — public endpoint, no auth needed
  async getProgress(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await donationsService.getDonationProgress();
      success(res, progress);
    } catch (error) {
      next(error);
    }
  }
};
