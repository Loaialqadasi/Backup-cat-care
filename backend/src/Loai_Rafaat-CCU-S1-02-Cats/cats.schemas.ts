import { z } from 'zod';

export const healthStatusEnum = z.enum(['healthy', 'needs_attention', 'injured', 'unknown']);
export const ownershipTagEnum = z.enum(['stray', 'adopted', 'campus_managed', 'unknown']);

// optional numeric fields that might come as empty strings from forms
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(min).max(max)
  ).optional();

export const createCatSchema = z.object({
  nickname: z.string().min(2).max(100).trim(),
  description: z.string().max(2000).optional().nullable(),
  photoUrl: z
    .string()
    .max(500)
    .refine(
      (val) => val === null || val === undefined || val.startsWith('/uploads/') || z.string().url().safeParse(val).success,
      { message: 'photoUrl must be a valid URL or an /uploads/ path' }
    )
    .optional()
    .nullable(),
  locationName: z.string().min(2).max(180).trim(),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  healthStatus: healthStatusEnum.default('unknown'),
  ownershipTag: ownershipTagEnum.default('unknown')
});

export const listCatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().min(1).max(100).optional(),
  healthStatus: healthStatusEnum.optional()
});

export const catIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});
