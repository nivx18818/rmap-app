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
  avatarUrlSnapshot?: string;
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
  const [avatarUrlSnapshot, setAvatarUrlSnapshot] = useState<string | undefined>();

  const openPicker = useCallback(() => {
    setAvatarUrlSnapshot(watch('avatarUrl'));
    setIsOpen(true);
  }, [watch]);

  const cancelPicker = useCallback(() => {
    setValue('avatarUrl', avatarUrlSnapshot ?? '', {
      shouldDirty: avatarUrlSnapshot !== watch('avatarUrl'),
    });
    setIsOpen(false);
    setAvatarUrlSnapshot(undefined);
  }, [avatarUrlSnapshot, setValue, watch]);

  const selectAvatar = useCallback(
    (seed: string) => {
      setValue('avatarUrl', buildAvatarUrl(seed), { shouldDirty: true });
    },
    [setValue],
  );

  const resetSelected = useCallback(() => {
    setValue('avatarUrl', avatarUrlSnapshot ?? '', {
      shouldDirty: avatarUrlSnapshot !== watch('avatarUrl'),
    });
  }, [avatarUrlSnapshot, setValue, watch]);

  const regenerate = useCallback(() => {
    setAvatarSeeds(generateSeeds());
    setValue('avatarUrl', avatarUrlSnapshot ?? '', {
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
