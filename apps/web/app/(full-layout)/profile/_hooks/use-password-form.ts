'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/design-system/lib/toast';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { authService } from '@/services/auth.service';
import { type PasswordChangeValues, passwordChangeSchema } from '@/validations/profile.schema';

interface UsePasswordFormOptions {
  onSuccess: () => void;
}

export function usePasswordForm({ onSuccess }: UsePasswordFormOptions) {
  const [isChanging, setIsChanging] = useState(false);

  const form = useForm<PasswordChangeValues>({
    defaultValues: {
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    },
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = useCallback(
    async (values: PasswordChangeValues) => {
      setIsChanging(true);
      try {
        await authService.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        form.reset();
        onSuccess();
        toast.success('Password changed', {
          description: 'Please sign in again with your new password.',
        });
      } catch {
        toast.error('Password change failed', {
          description: 'Please check your current password and try again.',
        });
      } finally {
        setIsChanging(false);
      }
    },
    [form, onSuccess],
  );

  return { form, isChanging, onSubmit };
}
