'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Login02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { toast } from '@repo/design-system/lib/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordInput } from '@/app/(auth)/_components/password-input';
import { authService } from '@/services/auth.service';
import { type ResetPasswordValues, resetPasswordSchema } from '@/validations/auth.schema';

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasToken = token.length > 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!hasToken) {
      toast.error('Reset link is invalid', {
        description: 'Please request a new password reset link.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword({
        newPassword: values.password,
        token,
      });
      toast.success('Password updated', {
        description: 'You can now sign in with your new password.',
      });
      router.push('/sign-in');
    } catch {
      toast.error('Password reset failed', {
        description: 'The link may be expired or already used. Please request a new one.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-1 flex-col items-center justify-center pb-8 sm:pb-12">
      <h1 className="font-heading text-foreground mb-4 text-center text-2xl leading-[1.325] font-semibold tracking-[-0.56px] sm:text-[28px]">
        Create a New Password
      </h1>

      <p className="text-muted-foreground mb-8 max-w-137.5 text-center text-base leading-[1.5] sm:mb-12">
        Choose a new password for your RMap account.
      </p>

      {!hasToken && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mb-6 w-full max-w-137.5 rounded-lg border px-4 py-3 text-sm leading-[1.45]">
          This reset link is missing its token. Please request a new password reset email.
        </div>
      )}

      <form
        className="blur-wrapper-form flex w-full max-w-137.5 flex-col gap-6"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup className="gap-6">
          <Field data-invalid={!!errors.password}>
            <FieldLabel className="text-base font-normal" htmlFor="password">
              New Password
            </FieldLabel>
            <PasswordInput
              id="password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              disabled={!hasToken || isSubmitting}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel className="text-base font-normal" htmlFor="confirm-password">
              Confirm New Password
            </FieldLabel>
            <PasswordInput
              id="confirm-password"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              disabled={!hasToken || isSubmitting}
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Field>
            <Button
              size="lg"
              className="group/btn w-full"
              type="submit"
              disabled={!hasToken || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
              {!isSubmitting && <AnimatedIconSwap icon={ArrowRight} hoverIcon={Login02FreeIcons} />}
            </Button>
          </Field>
        </FieldGroup>

        <p className="text-muted-foreground text-center text-base leading-[1.4]">
          Need a new link?{' '}
          <Link
            className="text-primary hover:text-primary-active mt-1.5 w-fit text-base leading-[1.4] hover:underline"
            href={'/forgot-password' as Route<string>}
          >
            Request again
          </Link>
        </p>
      </form>
    </div>
  );
}
