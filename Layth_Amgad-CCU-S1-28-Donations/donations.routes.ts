// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { adminMiddleware } from './admin.middleware.js';
import { donationSubmitLimiter } from '../Layth_Amgad-CCU-S1-01-Auth/rate-limiter.middleware.js';
import { donationsController } from './donations.controller.js';
import {
  donationIdParamSchema,
  reviewDonationSchema,
  submitDonationSchema
} from './donations.schemas.js';

export const donationsRoutes = Router();

// make sure the upload folder exists before multer tries to save anything
const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
fs.mkdirSync(uploadDir, { recursive: true });

// DRY: single source of truth for MIME types and their extensions
const MIME_CONFIG: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic'
};
const allowedReceiptTypes = new Set(Object.keys(MIME_CONFIG));

// magic-byte signatures for image validation — prevents MIME-type spoofing
const IMAGE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF header
  // HEIC files start with 'ftyp' box — too complex for simple magic-byte check, skip
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = MIME_CONFIG[file.mimetype];
    if (!extension) {
      return cb(
        new ValidationError('Only JPG, PNG, WEBP or HEIC images are accepted', { field: 'receipt' }),
        ''
      );
    }
    // 16 random bytes = 128 bits of entropy for filename security
    const randomId = crypto.randomBytes(16).toString('hex');
    const filename = `receipt-${Date.now()}-${randomId}${extension}`;
    cb(null, filename);
  }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedReceiptTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, WEBP or HEIC images are accepted', { field: 'receipt' }));
  }
  // validate magic bytes from the file stream header
  const signatures = IMAGE_SIGNATURES[file.mimetype];
  if (signatures && file.stream) {
    let headerChecked = false;
    file.stream.once('data', (chunk: Buffer) => {
      if (headerChecked) return;
      headerChecked = true;
      const matches = signatures.some((sig) =>
        chunk.length >= sig.length && sig.equals(chunk.subarray(0, sig.length))
      );
      if (!matches) {
        return cb(new ValidationError('File content does not match the declared image type', { field: 'receipt' }));
      }
      cb(null, true);
    });
    file.stream.once('error', (err: Error) => cb(err));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB — receipts can be high-res phone photos
});

// cleanup orphaned file if body validation fails after multer writes the file
const cleanupOrphanOnValidationFail = (err: unknown, req: Request, _res: Response, next: NextFunction) => {
  const file = (req as any).file;
  if (err && file?.path) {
    fs.unlink(file.path, () => {}); // async delete, ignore errors
  }
  next(err);
};

// --- public-ish routes (no auth needed) ---

// anyone can check the fundraising progress bar
donationsRoutes.get('/progress', donationsController.getProgress);

// donors submit here — no login required so anyone can donate
// validate body BEFORE multer writes the file to prevent orphaned uploads
// cleanupOrphanOnValidationFail deletes the file if validation fails after upload
donationsRoutes.post(
  '/',
  donationSubmitLimiter,
  validate({ body: submitDonationSchema }),
  upload.single('receipt'),
  donationsController.submit,
  cleanupOrphanOnValidationFail
);

// --- admin-only routes ---

// list all pending receipts waiting for review
donationsRoutes.get(
  '/pending',
  authMiddleware,
  adminMiddleware,
  donationsController.getPending
);

// approve or reject a single donation
donationsRoutes.patch(
  '/:id/review',
  authMiddleware,
  adminMiddleware,
  validate({ params: donationIdParamSchema, body: reviewDonationSchema }),
  donationsController.review
);
