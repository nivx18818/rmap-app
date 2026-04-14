'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Login02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
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
import { type SignUpValues, signUpSchema } from '@/validations/auth';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
      terms: false,
    },
    resolver: zodResolver(signUpSchema),
  });

  const agreedTerms = watch('terms');

  const onSubmit = async (values: SignUpValues) => {
    setIsSubmitting(true);

    try {
      await signUp(values);
      toast.success('Account created successfully');
      router.push('/ai');
    } catch {
      toast.error('Sign up failed', {
        description: 'Email may already exist or request is invalid.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-full flex-1 flex-col items-center justify-center pb-8 sm:pb-12">
      <h1 className="font-heading text-foreground mb-8 text-center text-2xl leading-[1.325] font-semibold tracking-[-0.56px] sm:mb-12 sm:text-[28px]">
        Sign up for an Account
      </h1>

      <form
        className="blur-wrapper-form flex w-full max-w-165 flex-col gap-6"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup className="gap-6">
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel className="text-base font-normal" htmlFor="full-name">
              Full Name
            </FieldLabel>
            <Input
              id="full-name"
              placeholder="John Doe"
              type="text"
              aria-invalid={!!errors.fullName}
              {...register('fullName')}
            />
            <FieldError errors={[errors.fullName]} />
          </Field>

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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <Field data-invalid={!!errors.password}>
              <FieldLabel className="text-base font-normal" htmlFor="password">
                Password
              </FieldLabel>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel className="text-base font-normal" htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <PasswordInput
                id="confirm-password"
                placeholder="Confirm your password"
                autoComplete="confirm-password"
                aria-invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.terms} orientation="horizontal">
            <Checkbox
              id="terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => {
                setValue('terms', checked === true, { shouldValidate: true });
              }}
            />
            <FieldLabel className="text-sm font-normal sm:text-base" htmlFor="terms">
              I agree to the terms of service and privacy policy.
            </FieldLabel>
          </Field>
          <FieldError errors={[errors.terms]} />

          <Field>
            <Button size="lg" className="group/btn w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up...' : 'Sign up'}
              {!isSubmitting && <AnimatedIconSwap icon={ArrowRight} hoverIcon={Login02FreeIcons} />}
            </Button>
          </Field>
        </FieldGroup>

        <SocialAuthButtons />

        <p className="text-muted-foreground text-center text-base leading-[1.4]">
          Already have an Account?{' '}
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
