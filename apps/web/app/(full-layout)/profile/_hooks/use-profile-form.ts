'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/design-system/lib/toast';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { AuthUser } from '@/types/auth';

import { authService } from '@/services/auth.service';
import { type ProfileInfoValues, profileInfoSchema } from '@/validations/profile.schema';

interface UseProfileFormOptions {
  user: AuthUser;
  onSuccess: () => Promise<void>;
  onSaved: () => void;
}

export function useProfileForm({ user, onSuccess, onSaved }: UseProfileFormOptions) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileInfoValues>({
    defaultValues: {
      avatarUrl: user.avatarUrl ?? '',
      fullName: user.fullName ?? '',
    },
    resolver: zodResolver(profileInfoSchema),
  });

  // Keep form in sync when user data updates (e.g. after save)
  useEffect(() => {
    form.reset({
      avatarUrl: user.avatarUrl ?? '',
      fullName: user.fullName ?? '',
    });
  }, [form, user.avatarUrl, user.fullName]);

  const onSubmit = useCallback(
    async (values: ProfileInfoValues) => {
      setIsSaving(true);
      try {
        await authService.updateProfile(values);
        await onSuccess();
        onSaved();
        toast.success('Profile updated');
      } catch {
        toast.error('Profile update failed', {
          description: 'Please check your name and try again.',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [onSaved, onSuccess],
  );

  return { form, isSaving, onSubmit };
}
