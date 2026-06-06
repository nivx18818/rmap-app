'use client';

import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@repo/design-system/components/ui/field';
import { TabsContent } from '@repo/design-system/components/ui/tabs';

import { PasswordInput } from '@/app/(auth)/_components/password-input';

import type { usePasswordForm } from '../_hooks/use-password-form';

interface SecurityTabProps {
  passwordForm: ReturnType<typeof usePasswordForm>;
}

export function SecurityTab({ passwordForm }: SecurityTabProps) {
  const { form, isChanging, onSubmit } = passwordForm;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <TabsContent value="security">
      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Change your password and sign out of active RMap sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <h3 className="text-heading text-sm font-medium">Password</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Use at least 8 characters. You will sign in again after the change.
              </p>
            </div>
            <FieldGroup>
              <Field data-invalid={!!errors.currentPassword}>
                <FieldLabel htmlFor="current-password">Current password</FieldLabel>
                <PasswordInput
                  id="current-password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.currentPassword}
                  {...register('currentPassword')}
                />
                <FieldError errors={[errors.currentPassword]} />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field data-invalid={!!errors.newPassword}>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.newPassword}
                    {...register('newPassword')}
                  />
                  <FieldDescription>Minimum 8 characters.</FieldDescription>
                  <FieldError errors={[errors.newPassword]} />
                </Field>

                <Field data-invalid={!!errors.confirmPassword}>
                  <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  <FieldDescription>Must match the new password.</FieldDescription>
                  <FieldError errors={[errors.confirmPassword]} />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button id="change-password-submit" type="submit" disabled={isChanging}>
                  {isChanging ? 'Changing password...' : 'Change password'}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
