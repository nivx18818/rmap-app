import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signUpSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    email: z.string().email('Please enter a valid email'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    terms: z.boolean().refine((value) => value, {
      message: 'You must agree to the terms',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
