// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { z } from 'zod';

// donor submits this when uploading a receipt
export const submitDonationSchema = z.object({
  donorName: z.string().min(2).max(120).trim()
    .regex(/^[a-zA-Z\s'\-\.]+$/, 'Name contains invalid characters'),
  donorEmail: z.string().email().max(160).trim().toLowerCase(),
  // claimed amount in MYR — at least RM 1, cap at RM 1 million, max 2 decimal places
  claimedAmount: z.coerce.number().positive().min(1).max(1_000_000)
    .refine(val => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: 'Amount must have at most 2 decimal places'
    })
});

// admin sends this to approve or reject
export const reviewDonationSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().max(500).optional().refine(
    (val, ctx) => {
      const parent = ctx.parent as { status: string };
      return parent.status !== 'rejected' || (val !== undefined && val.trim().length > 0);
    },
    { message: 'Rejection reason is required when rejecting a donation' }
  )
});

// route param — must be a positive integer
export const donationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});
