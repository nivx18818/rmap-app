'use client';

import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { useEffect, useState } from 'react';

interface UseDrawerDraftOptions<TValues extends FieldValues> {
  defaultValues: TValues;
  form: UseFormReturn<TValues>;
  isOpen: boolean;
  storageKey: string;
}

export function useDrawerDraft<TValues extends FieldValues>({
  defaultValues,
  form,
  isOpen,
  storageKey,
}: UseDrawerDraftOptions<TValues>) {
  const [hasDraft, setHasDraft] = useState(false);
  const [canAutosave, setCanAutosave] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasDraft(false);
      setCanAutosave(false);
      return;
    }

    const storedDraft = window.localStorage.getItem(storageKey);

    setHasDraft(storedDraft !== null);
    setCanAutosave(storedDraft === null);
  }, [isOpen, storageKey]);

  useEffect(() => {
    if (!isOpen || !canAutosave) {
      return;
    }

    const subscription = form.watch((values) => {
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [canAutosave, form, isOpen, storageKey]);

  const restoreDraft = () => {
    const storedDraft = window.localStorage.getItem(storageKey);

    if (!storedDraft) {
      setHasDraft(false);
      setCanAutosave(true);
      return;
    }

    try {
      form.reset(JSON.parse(storedDraft) as TValues);
      setHasDraft(false);
      setCanAutosave(true);
    } catch {
      window.localStorage.removeItem(storageKey);
      form.reset(defaultValues);
      setHasDraft(false);
      setCanAutosave(true);
    }
  };

  const discardDraft = () => {
    window.localStorage.removeItem(storageKey);
    form.reset(defaultValues);
    setHasDraft(false);
    setCanAutosave(true);
  };

  const clearDraft = () => {
    window.localStorage.removeItem(storageKey);
    setHasDraft(false);
    setCanAutosave(false);
  };

  return {
    clearDraft,
    discardDraft,
    hasDraft,
    restoreDraft,
  };
}
