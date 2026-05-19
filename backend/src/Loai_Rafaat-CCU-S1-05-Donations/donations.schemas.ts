import { z } from 'zod';

// Student IDs at UTM follow patterns like A21CS0011, MH220001, etc.
// We accept any non-empty alphanumeric string up to 20 chars — strict enough to catch typos
const idFieldSchema = z
  .string()
  .trim()
  .min(3, { message: 'ID must be at least 3 characters' })
  .max(20, { message: 'ID must be 20 characters or fewer' })
  .regex(/^[A-Za-z0-9]+$/, { message: 'ID must contain only letters and numbers' })
  .optional();

export const createDonationSchema = z.object({
  donorName: z
    .string()
    .trim()
    .min(2, { message: 'Donor name is required' })
    .max(120, { message: 'Donor name is too long' }),

  donorEmail: z
    .string()
    .trim()
    .email({ message: 'A valid donor email is required' })
    .max(160),

  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than 0' })
    .max(99999.99, { message: 'Amount seems too large — please verify' }),

  currency: z
    .string()
    .trim()
    .length(3, { message: 'Currency must be a 3-letter code, e.g. MYR' })
    .toUpperCase()
    .default('MYR'),

  message: z
    .string()
    .trim()
    .max(500, { message: 'Message must be 500 characters or fewer' })
    .optional(),

  // Sensitive fields — validated here, encrypted in the service layer before DB write
  studentId: idFieldSchema,
  volunteerId: idFieldSchema,
});

export const reviewReceiptSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be "approved" or "rejected"' })
  }),

  adminNotes: z
    .string()
    .trim()
    .max(1000, { message: 'Admin notes must be 1000 characters or fewer' })
    .optional(),
});

export const donationQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  status:   z.enum(['pending', 'approved', 'rejected']).optional(),
  search:   z.string().trim().max(50).optional(), // matches against donor name / email
});
