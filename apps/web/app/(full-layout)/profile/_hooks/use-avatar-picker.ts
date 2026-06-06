'use client';

import { useCallback, useState } from 'react';
import { type UseFormSetValue, type UseFormWatch } from 'react-hook-form';

import type { ProfileInfoValues } from '@/validations/profile.schema';

import { buildAvatarUrl, generateSeeds } from '../_utils/avatar';

interface UseAvatarPickerOptions {
  setValue: UseFormSetValue<ProfileInfoValues>;
  watch: UseFormWatch<ProfileInfoValues>;
}

export interface UseAvatarPickerReturn {
  avatarSeeds: string[];
  avatarUrlSnapshot: null | string;
  isOpen: boolean;
  cancelPicker: () => void;
  openPicker: () => void;
  regenerate: () => void;
  resetSelected: () => void;
  selectAvatar: (seed: string) => void;
}

export function useAvatarPicker({
  setValue,
  watch,
}: UseAvatarPickerOptions): UseAvatarPickerReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarSeeds, setAvatarSeeds] = useState<string[]>(() => generateSeeds());
  // Snapshot of avatarUrl at the moment picker was opened — used for Cancel/X reset
  const [avatarUrlSnapshot, setAvatarUrlSnapshot] = useState<null | string>(null);

  const openPicker = useCallback(() => {
    setAvatarUrlSnapshot(watch('avatarUrl') ?? null);
    setIsOpen(true);
  }, [watch]);

  const cancelPicker = useCallback(() => {
    setValue('avatarUrl', avatarUrlSnapshot, {
      shouldDirty: avatarUrlSnapshot !== watch('avatarUrl'),
    });
    setIsOpen(false);
    setAvatarUrlSnapshot(null);
  }, [avatarUrlSnapshot, setValue, watch]);

  const selectAvatar = useCallback(
    (seed: string) => {
      setValue('avatarUrl', buildAvatarUrl(seed), { shouldDirty: true });
      // Picker stays open so user can continue browsing
    },
    [setValue],
  );

  const resetSelected = useCallback(() => {
    // X icon: restore to snapshot without closing picker
    setValue('avatarUrl', avatarUrlSnapshot, {
      shouldDirty: avatarUrlSnapshot !== watch('avatarUrl'),
    });
  }, [avatarUrlSnapshot, setValue, watch]);

  const regenerate = useCallback(() => {
    setAvatarSeeds(generateSeeds());
    // Reset selected avatar since the new collection won't contain it
    setValue('avatarUrl', avatarUrlSnapshot, {
      shouldDirty: avatarUrlSnapshot !== watch('avatarUrl'),
    });
  }, [avatarUrlSnapshot, setValue, watch]);

  return {
    avatarSeeds,
    avatarUrlSnapshot,
    isOpen,
    cancelPicker,
    openPicker,
    regenerate,
    resetSelected,
    selectAvatar,
  };
}
