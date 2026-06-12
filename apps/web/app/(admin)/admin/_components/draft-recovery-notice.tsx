'use client';

import { Button } from '@repo/design-system/components/ui/button';

interface DraftRecoveryNoticeProps {
  onDiscard: () => void;
  onRestore: () => void;
}

export function DraftRecoveryNotice({ onDiscard, onRestore }: DraftRecoveryNoticeProps) {
  return (
    <div className="border-border bg-muted/30 mt-4 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Saved draft found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Restore your unsaved changes or discard the draft and keep the current values.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onDiscard}>
            Discard
          </Button>
          <Button size="sm" type="button" onClick={onRestore}>
            Restore
          </Button>
        </div>
      </div>
    </div>
  );
}
