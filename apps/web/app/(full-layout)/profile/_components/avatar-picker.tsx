import { Cancel01Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';

import { buildAvatarUrl } from '../_utils/avatar';

interface AvatarPickerProps {
  avatarSeeds: string[];
  selectedUrl: null | string | undefined;
  onRegenerate: () => void;
  onResetSelected: () => void;
  onSelect: (seed: string) => void;
}

export function AvatarPicker({
  avatarSeeds,
  selectedUrl,
  onRegenerate,
  onResetSelected,
  onSelect,
}: AvatarPickerProps) {
  return (
    <div className="bg-card/50 rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Pick an avatar
        </p>
        <Button
          id="regenerate-avatars"
          variant="ghost"
          size="sm"
          type="button"
          onClick={onRegenerate}
        >
          <HugeiconsIcon className="size-4" icon={Refresh01Icon} />
          Generate new collection
        </Button>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {avatarSeeds.map((seed) => {
          const url = buildAvatarUrl(seed);
          const isSelected = selectedUrl === url;
          return (
            <div key={seed} className="relative">
              <button
                id={`avatar-option-${seed.slice(0, 8)}`}
                className={`bg-muted/30 relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border p-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-primary/20 scale-105 shadow-md ring-2'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                }`}
                type="button"
                onClick={() => onSelect(seed)}
              >
                <Image
                  className="h-full w-full object-contain"
                  alt="Avatar option"
                  src={url}
                  width={56}
                  height={56}
                  unoptimized
                />
              </button>
              {isSelected && (
                <button
                  id={`avatar-deselect-${seed.slice(0, 8)}`}
                  className="bg-background text-muted-foreground hover:bg-destructive absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border shadow-sm transition-colors hover:text-white"
                  type="button"
                  aria-label="Deselect avatar"
                  onClick={onResetSelected}
                >
                  <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
