import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { donationsService } from './donations.service.js';
import { CreateDonationInput, ReviewReceiptInput, ReceiptStatus } from './donations.types.js';
import { deleteUploadedFile, validateFileMagicBytes } from './receipt-upload.middleware.js';

export const donationsController = {

  // POST /api/donations — authenticated donors create a donation record
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateDonationInput;
      const donorUserId = req.user?.id ?? null;
      const receiptFile = req.file; // populated by multer if a file was attached

      // C-5 fix: validate actual file content via magic bytes (not client-provided MIME type)
      if (receiptFile) {
        await validateFileMagicBytes(receiptFile.path, receiptFile.mimetype);
      }

      const donation = await donationsService.create(input, donorUserId, receiptFile);
      success(res, donation, 201);
    } catch (error) {
      // Clean up the uploaded file if something downstream throws
      if (req.file?.path) deleteUploadedFile(req.file.path);
      next(error);
    }
  },

  // POST /api/donations/:id/receipt — donor uploads a receipt to an existing donation
  async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AuthorizationError('Authentication required'));
      if (!req.file)  return next(new Error('No file was uploaded'));

      // C-5 fix: validate actual file content via magic bytes
      await validateFileMagicBytes(req.file.path, req.file.mimetype);

      const donationId = parseInt(req.params.id, 10);
      const donation = await donationsService.uploadReceipt(donationId, req.user.id, req.file);
      success(res, donation);
    } catch (error) {
      if (req.file?.path) deleteUploadedFile(req.file.path);
      next(error);
    }
  },

  // GET /api/donations — paginated list; admins see all, others see only their own
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as { page?: string; pageSize?: string; status?: string; search?: string };

      // H-1 fix: admins get the full list with decrypted IDs;
      // regular users only see their own donations
      if (req.user?.role === 'admin') {
        const result = await donationsService.listAdmin({
          page:     query.page     ? parseInt(query.page, 10) : undefined,
          pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
          status:   query.status as ReceiptStatus | undefined,
          search:   query.search,
        });
        return success(res, result);
      }

      const result = await donationsService.list({
        page:         query.page     ? parseInt(query.page, 10) : undefined,
        pageSize:     query.pageSize ? parseInt(query.pageSize, 10) : undefined,
        status:       query.status as ReceiptStatus | undefined,
        search:       query.search,
        donorUserId:  req.user?.id,
      });
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/donations/:id — single donation; admins see decrypted IDs
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (req.user?.role === 'admin') {
        const donation = await donationsService.getByIdAdmin(id);
        return success(res, donation);
      }

      // H-1 fix: non-admin users can only view their own donations
      const donation = await donationsService.getById(id);
      if (donation && donation.donorUserId !== req.user?.id) {
        return next(new AuthorizationError('You can only view your own donations'));
      }
      success(res, donation);
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/donations/:id/review — admin approves or rejects a receipt
  async reviewReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AuthorizationError('Authentication required'));
      if (req.user.role !== 'admin') {
        return next(new AuthorizationError('Only admins can review receipts'));
      }

      const donationId = parseInt(req.params.id, 10);
      const input = req.body as ReviewReceiptInput;
      const donation = await donationsService.reviewReceipt(donationId, req.user.id, input);
      success(res, donation);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/donations/search/student?studentId=...  — hash-based lookup, no plaintext stored
  async searchByStudentId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return next(new AuthorizationError('Only admins can search by student ID'));
      }
      const studentId = req.query.studentId;
      if (typeof studentId !== 'string' || studentId.trim() === '') {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId query parameter is required' } });
        return;
      }
      const results = await donationsService.searchByStudentId(studentId.trim());
      success(res, results);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/donations/search/volunteer?volunteerId=...
  async searchByVolunteerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return next(new AuthorizationError('Only admins can search by volunteer ID'));
      }
      const volunteerId = req.query.volunteerId;
      if (typeof volunteerId !== 'string' || volunteerId.trim() === '') {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'volunteerId query parameter is required' } });
        return;
      }
      const results = await donationsService.searchByVolunteerId(volunteerId.trim());
      success(res, results);
    } catch (error) {
      next(error);
    }
  },
};
