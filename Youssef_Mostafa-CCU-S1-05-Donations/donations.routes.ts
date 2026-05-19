// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { donationsController } from './donations.controller.js';
import { createDonationBodySchema } from './donations.schemas.js';

export const donationsRoutes = Router();

// 5 donation uploads per 15 minutes per IP — prevents abuse
const donationUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many upload attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Separate folder from cat photos — prevents cross-feature file collisions
const uploadDir = path.join(process.cwd(), 'uploads', 'donations');
fs.mkdirSync(uploadDir, { recursive: true });

// Per acceptance criteria: only .jpg .jpeg .png — no WEBP for receipts
const allowedMimeTypes = new Set(['image/jpeg', 'image/png']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

// Magic-byte signatures for image validation (defence in depth against MIME spoofing)
const magicBytes: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

function checkMagicBytes(filePath: string, expectedMime: string): boolean {
  const sig = magicBytes[expectedMime];
  if (!sig) return false;
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(sig.length);
    fs.readSync(fd, buf, 0, sig.length, 0);
    return buf.equals(sig);
  } finally {
    fs.closeSync(fd);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = mimeExtensionMap[file.mimetype];
    if (!extension) {
      return cb(
        new ValidationError('Only JPG or PNG images are allowed', { field: 'receipt' }),
        ''
      );
    }
    // Randomised filename prevents path traversal attacks and naming collisions
    const randomId = crypto.randomBytes(8).toString('hex');
    const filename = `donation-${Date.now()}-${randomId}${extension}`;
    cb(null, filename);
  },
});

// Double-check MIME type before saving — defence in depth
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG or PNG images are allowed', { field: 'receipt' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max — matches acceptance criteria
});

// POST /api/donations/upload
// Order is critical: rate limit -> auth -> file upload -> body validation -> controller
donationsRoutes.post(
  '/upload',
  donationUploadLimiter,
  authMiddleware,
  upload.single('receipt'), // field name MUST stay 'receipt' — frontend FormData uses the same
  validate({ body: createDonationBodySchema }),
  donationsController.upload
);
