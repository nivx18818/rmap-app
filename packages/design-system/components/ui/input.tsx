import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from '@repo/design-system/lib/utils';
import * as React from 'react';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 file:text-foreground border-border focus-visible:border-border bg-background text-foreground disabled:border-disabled disabled:bg-background disabled:text-disabled disabled:placeholder:text-disabled placeholder:text-muted-foreground/70 focus-visible:ring-ring h-11 w-full min-w-0 rounded-md border px-3 py-2.5 text-base shadow-[0_1px_2px_0_rgba(139,92,246,0.10)] transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:shadow-none focus-visible:ring-2 disabled:cursor-not-allowed aria-invalid:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
