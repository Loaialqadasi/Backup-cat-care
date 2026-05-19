import { z } from 'zod';

export const donationStatusEnum = z.enum(['pending', 'verified', 'rejected']);

export const createDonationSchema = z.object({
  donorName: z.string().min(2).max(120).trim(),
  amount: z.coerce.number().positive().max(1000000),
  note: z.string().trim().max(500).optional().nullable()
});

export const listDonationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: donationStatusEnum.optional()
});

export const donationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const updateDonationStatusSchema = z.object({
  status: donationStatusEnum
});
