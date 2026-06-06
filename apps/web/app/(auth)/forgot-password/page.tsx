'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail01Icon } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { toast } from '@repo/design-system/lib/toast';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { authService } from '@/services/auth.service';
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/validations/auth.schema';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);

    try {
      await authService.forgotPassword(values);
      toast.success('Reset link sent', {
        description: 'If that email exists, reset instructions will arrive shortly.',
      });
    } catch {
      toast.error('Request failed', {
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-1 flex-col items-center justify-center pb-8 sm:pb-12">
      <h1 className="font-heading text-foreground mb-8 text-center text-2xl leading-[1.325] font-semibold tracking-[-0.56px] sm:mb-12 sm:text-[28px]">
        Reset Your Password
      </h1>

      <form
        className="blur-wrapper-form flex w-full max-w-137.5 flex-col gap-6"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup className="gap-6">
          <Field data-invalid={!!errors.email}>
            <FieldLabel className="text-base font-normal" htmlFor="email">
              Email
            </FieldLabel>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field>
            <Button size="lg" className="group/btn w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
              {!isSubmitting && <AnimatedIconSwap icon={ArrowRight} hoverIcon={Mail01Icon} />}
            </Button>
          </Field>
        </FieldGroup>

        <p className="text-muted-foreground text-center text-base leading-[1.4]">
          Remember your password?{' '}
          <Link
            className="text-primary hover:text-primary-active mt-1.5 w-fit text-base leading-[1.4] hover:underline"
            href={'/sign-in' as Route<string>}
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
