import { z } from 'zod';

export const profileInfoSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  avatarUrl: z.string().url(),
});

export const passwordChangeSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
export type ProfileInfoValues = z.infer<typeof profileInfoSchema>;
