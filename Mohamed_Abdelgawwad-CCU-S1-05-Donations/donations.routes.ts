import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import {
  createDonationSchema,
  donationIdParamSchema,
  listDonationsQuerySchema,
  updateDonationStatusSchema
} from './donations.schemas.js';
import { donationsController } from './donations.controller.js';

export const donationsRoutes = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = mimeExtensionMap[file.mimetype];
    if (!extension) {
      return cb(new ValidationError('Only JPG, PNG, WEBP, or PDF receipts are allowed', { field: 'receipt' }), '');
    }
    const randomId = crypto.randomBytes(6).toString('hex');
    cb(null, `receipt-${Date.now()}-${randomId}${extension}`);
  }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, WEBP, or PDF receipts are allowed', { field: 'receipt' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

// public endpoint for real-time fundraiser status
// includes only verified donations
donationsRoutes.get('/public-progress', donationsController.publicProgress);

// donor uploads receipt (student/public user in app)
donationsRoutes.post(
  '/receipts',
  authMiddleware,
  upload.single('receipt'),
  validate({ body: createDonationSchema }),
  donationsController.submitReceipt
);

// admin workflow: list + review submissions
donationsRoutes.get('/admin/submissions', authMiddleware, validate({ query: listDonationsQuerySchema }), donationsController.listForAdmin);

donationsRoutes.patch(
  '/admin/submissions/:id/status',
  authMiddleware,
  validate({ params: donationIdParamSchema, body: updateDonationStatusSchema }),
  donationsController.updateStatus
);
