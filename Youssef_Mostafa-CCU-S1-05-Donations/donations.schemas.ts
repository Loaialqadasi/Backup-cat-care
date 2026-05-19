// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
import { z } from 'zod';

// amount arrives as a multipart/form-data text field so we coerce it to number.
// imageUrl is NOT validated here — it comes from Multer's req.file, not req.body.
export const createDonationBodySchema = z.object({
  amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive({ message: 'Amount must be greater than 0' })
      .max(999999.99, { message: 'Amount is too large' })
  )
});

export type CreateDonationBody = z.infer<typeof createDonationBodySchema>;
