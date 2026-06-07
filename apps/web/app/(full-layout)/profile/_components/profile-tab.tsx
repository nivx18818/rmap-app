'use client';

import { ArrowLeft01Icon, Edit01Icon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Separator } from '@repo/design-system/components/ui/separator';
import { TabsContent } from '@repo/design-system/components/ui/tabs';

import type { UseAvatarPickerReturn } from '../_hooks/use-avatar-picker';
import type { useProfileForm } from '../_hooks/use-profile-form';

import { useProfileTab } from '../_hooks/use-profile-tab';
import { getInitials } from '../_utils/formatters';
import { AvatarPicker } from './avatar-picker';

interface ProfileTabProps {
  avatarPicker: UseAvatarPickerReturn;
  displayName: string;
  profileForm: ReturnType<typeof useProfileForm>;
}

export function ProfileTab({ avatarPicker, displayName, profileForm }: ProfileTabProps) {
  const {
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
    isDirty,
    isEditingDetails,
    isSaving,
    register,
  } = useProfileTab({
    avatarPicker,
    displayName,
    profileForm,
  });

  return (
    <TabsContent value="profile">
      <form className="flex flex-col gap-0" noValidate onSubmit={handleSubmitProfile}>
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Public profile</CardTitle>
            <CardDescription>
              Control the profile details shown across your RMap workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-8 pt-6">
            {/* ── Avatar Section ── */}
            <section className="flex flex-col gap-5">
              {/* Header + preview row */}
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <h3 className="text-heading text-sm font-medium">Avatar</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose a pre-designed avatar for your profile.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar size="lg" className="size-20! shrink-0 overflow-hidden rounded-xl">
                    <AvatarImage
                      className="h-full w-full object-contain"
                      alt={displayName}
                      src={currentAvatarUrl}
                    />
                    <AvatarFallback className="rounded-xl text-xl">
                      {getInitials(displayName) || <HugeiconsIcon icon={UserCircleIcon} />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <p className="text-heading text-sm font-medium">Current avatar</p>
                    {avatarPicker.isOpen ? (
                      <Button
                        id="cancel-avatar-picker"
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleCancelAvatarPicker}
                      >
                        <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        id="open-avatar-picker"
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleOpenAvatarPicker}
                      >
                        <HugeiconsIcon className="size-4" icon={Edit01Icon} />
                        Change avatar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar picker — full width, only shown when open */}
              {avatarPicker.isOpen && (
                <AvatarPicker
                  avatarSeeds={avatarPicker.avatarSeeds}
                  selectedUrl={formAvatarUrl}
                  onResetSelected={handleResetSelectedAvatar}
                  onRegenerate={handleRegenerateAvatars}
                  onSelect={handleSelectAvatar}
                />
              )}
            </section>

            <Separator />

            {/* ── Personal Details Section ── */}
            <section className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <h3 className="text-heading text-sm font-medium">Personal details</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Keep your name and public identity up to date.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {isEditingDetails ? (
                  <>
                    <FieldGroup>
                      <Field data-invalid={!!errors.fullName}>
                        <FieldLabel htmlFor="full-name">
                          <HugeiconsIcon className="size-4" icon={UserCircleIcon} />
                          Full name
                        </FieldLabel>
                        <Input
                          id="full-name"
                          type="text"
                          autoComplete="name"
                          aria-invalid={!!errors.fullName}
                          {...register('fullName')}
                        />
                        <FieldError errors={[errors.fullName]} />
                      </Field>
                    </FieldGroup>

                    <div className="flex gap-2">
                      <Button
                        id="cancel-edit-details"
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="bg-muted/20 flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-muted-foreground text-xs">Full name</p>
                      <p className="text-heading text-sm font-medium">{displayName}</p>
                    </div>
                    <Button
                      id="edit-personal-details"
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleStartEditingDetails}
                    >
                      <HugeiconsIcon className="size-4" icon={Edit01Icon} />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </CardContent>

          {/* ── Save Footer ── */}
          <div className="flex justify-end border-t px-6 py-4">
            <Button id="save-profile-changes" type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </Card>
      </form>
    </TabsContent>
  );
}
