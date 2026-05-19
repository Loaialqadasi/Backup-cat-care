import { z } from 'zod';

// only @graduate.utm.my emails are allowed
const GRADUATE_EMAIL_DOMAIN = '@graduate.utm.my';
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase())
  .refine((value) => value.endsWith(GRADUATE_EMAIL_DOMAIN), {
    message: 'Email must be from @graduate.utm.my domain'
  });

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .refine(
    (value) => /[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(value),
    { message: 'Password must contain at least one special character (!@#$%^&*...)' }
  );

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .transform((value) => normalizeSpaces(value))
    .refine((value) => value.split(' ').length >= 2, {
      message: 'Full name must contain at least two words'
    }),
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' })
});
