'use client';

import { useCallback, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { buildDefaultAvatar } from '@/utils/user';

import type { UseAvatarPickerReturn } from './use-avatar-picker';
import type { useProfileForm } from './use-profile-form';

interface UseProfileTabOptions {
  avatarPicker: UseAvatarPickerReturn;
  displayName: string;
  profileForm: ReturnType<typeof useProfileForm>;
}

export function useProfileTab({ avatarPicker, displayName, profileForm }: UseProfileTabOptions) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const { form, isSaving, onSubmit } = profileForm;
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = form;

  const formAvatarUrl = useWatch({
    control,
    name: 'avatarUrl',
  });
  const currentAvatarUrl = formAvatarUrl || buildDefaultAvatar(displayName);

  const handleCancelEdit = useCallback(() => {
    setIsEditingDetails(false);
    reset({
      fullName: displayName,
      avatarUrl: watch('avatarUrl'),
    });
  }, [displayName, reset, watch]);

  const handleSaved = useCallback(() => {
    avatarPicker.cancelPicker();
    setIsEditingDetails(false);
  }, [avatarPicker]);

  const handleSubmitProfile = handleSubmit((values) => {
    handleSaved();
    return onSubmit(values);
  });

  const handleCancelAvatarPicker = useCallback(() => {
    avatarPicker.cancelPicker();
  }, [avatarPicker]);

  const handleOpenAvatarPicker = useCallback(() => {
    avatarPicker.openPicker();
  }, [avatarPicker]);

  const handleResetSelectedAvatar = useCallback(() => {
    avatarPicker.resetSelected();
  }, [avatarPicker]);

  const handleRegenerateAvatars = useCallback(() => {
    avatarPicker.regenerate();
  }, [avatarPicker]);

  const handleSelectAvatar = useCallback(
    (seed: string) => {
      avatarPicker.selectAvatar(seed);
    },
    [avatarPicker],
  );

  const handleStartEditingDetails = useCallback(() => {
    setIsEditingDetails(true);
  }, []);

  return {
    currentAvatarUrl,
    errors,
    formAvatarUrl,
    handleCancelAvatarPicker,
    handleCancelEdit,
    handleOpenAvatarPicker,
    handleRegenerateAvatars,
    handleResetSelectedAvatar,
    handleSelectAvatar,
    handleStartEditingDetails,
    handleSubmitProfile,
    isEditingDetails,
    isSaving,
    isDirty,
    register: form.register,
  };
}
