'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Login02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { toast } from '@repo/design-system/lib/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordInput } from '@/app/(auth)/_components/password-input';
import { SocialAuthButtons } from '@/app/(auth)/_components/social-auth-buttons';
import { useAuth } from '@/hooks/use-auth';
import { type SignInValues, signInSchema } from '@/validations/auth';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInValues) => {
    setIsSubmitting(true);

    try {
      await signIn(values);
      toast.success('Signed in successfully');
      router.push('/ai');
    } catch {
      toast.error('Sign in failed', {
        description: 'Please check your credentials and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-1 flex-col items-center justify-center pb-8 sm:pb-12">
      <h1 className="font-heading text-foreground mb-8 text-center text-2xl leading-[1.325] font-semibold tracking-[-0.56px] sm:mb-12 sm:text-[28px]">
        Sign in to Your Account
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

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel className="text-base font-normal" htmlFor="password">
                Password
              </FieldLabel>
              <Link
                className="text-primary hover:text-primary-active text-sm font-medium hover:underline"
                href={'/' as Route<string>}
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field>
            <Button size="lg" className="group/btn w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              {!isSubmitting && <AnimatedIconSwap icon={ArrowRight} hoverIcon={Login02FreeIcons} />}
            </Button>
          </Field>
        </FieldGroup>

        <SocialAuthButtons />

        <p className="text-muted-foreground text-center text-base leading-[1.4]">
          Need an Account?{' '}
          <Link
            className="text-primary hover:text-primary-active mt-1.5 w-fit text-base leading-[1.4] hover:underline"
            href={'/sign-up' as Route<string>}
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
