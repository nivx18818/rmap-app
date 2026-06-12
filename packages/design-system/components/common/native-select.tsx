import type { ComponentProps } from 'react';

import { cn } from '@repo/design-system/lib/utils';

const CONTROL_CLASS_NAME =
  'border-border focus-visible:border-border bg-background text-foreground disabled:border-disabled disabled:bg-background disabled:text-disabled disabled:placeholder:text-disabled placeholder:text-muted-foreground/70 focus-visible:ring-ring min-h-10 w-full min-w-0 rounded-md border px-3 py-2.5 text-base shadow-[0_1px_2px_0_rgba(139,92,246,0.10)] transition-all outline-none focus-visible:shadow-none focus-visible:ring-2 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20';

function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CONTROL_CLASS_NAME, className)} {...props} />;
}

export { NativeSelect };
