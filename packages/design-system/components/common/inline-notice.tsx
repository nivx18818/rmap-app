import { cn } from '@repo/design-system/lib/utils';

function InlineNotice({
  className,
  description,
  title,
  tone = 'default',
}: {
  className?: string;
  description: string;
  title: string;
  tone?: 'default' | 'error';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        tone === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30',
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

export { InlineNotice };
