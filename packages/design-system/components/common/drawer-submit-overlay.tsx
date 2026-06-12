import { cn } from '@repo/design-system/lib/utils';

function DrawerSubmitOverlay({
  isVisible,
  label = 'Saving changes',
}: {
  isVisible: boolean;
  label?: string;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-background/70 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
      <div className="bg-card text-card-foreground flex items-center gap-3 rounded-lg border px-4 py-3 shadow-sm">
        <span
          aria-hidden="true"
          className={cn(
            'border-primary/20 border-t-primary size-5 animate-spin rounded-full border-2',
          )}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export { DrawerSubmitOverlay };
