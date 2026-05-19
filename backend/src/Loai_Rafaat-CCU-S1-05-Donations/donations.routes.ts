import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { donationsController } from './donations.controller.js';
import { createDonationSchema, reviewReceiptSchema, donationQuerySchema } from './donations.schemas.js';
import { receiptUpload } from './receipt-upload.middleware.js';

export const donationsRoutes = Router();

// H-6: Rate limiter for donation submission and file upload endpoints
const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 requests per window
  message: {
    success: false,
    error: 'Too many donation requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const receiptUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // stricter limit for file uploads (10 per 15 min)
  message: {
    success: false,
    error: 'Too many file uploads. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All donation routes require a valid JWT
donationsRoutes.use(authMiddleware);

// --- donor routes ---

// List all donations (paginated); admins see everything + decrypted IDs
donationsRoutes.get(
  '/',
  validate({ query: donationQuerySchema }),
  donationsController.list
);

// Create a donation, optionally with a receipt file in the same multipart request
// The upload field name must be "receipt" in the form data
donationsRoutes.post(
  '/',
  donationLimiter,
  receiptUpload.single('receipt'),
  validate({ body: createDonationSchema }),
  donationsController.create
);

// Donor uploads/replaces the receipt for a specific donation
donationsRoutes.post(
  '/:id/receipt',
  receiptUploadLimiter,
  receiptUpload.single('receipt'),
  donationsController.uploadReceipt
);

// --- admin search routes ---
// IMPORTANT: These MUST be registered before '/:id' below.
// Express matches routes in registration order — '/search/student' would be captured
// by '/:id' (with id = "search") if these were registered after it.
donationsRoutes.get('/search/student',   donationsController.searchByStudentId);
donationsRoutes.get('/search/volunteer', donationsController.searchByVolunteerId);

// --- parameterised routes (must come after all static paths) ---

// Get a single donation by ID
donationsRoutes.get('/:id', donationsController.getById);

// Admin approves or rejects a receipt
donationsRoutes.patch(
  '/:id/review',
  validate({ body: reviewReceiptSchema }),
  donationsController.reviewReceipt
);
