import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from '@repo/design-system/lib/utils';
import * as React from 'react';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 file:text-foreground border-border focus-visible:border-border h-11 w-full min-w-0 rounded-[6px] border bg-white px-3 py-2.5 text-base text-slate-900 shadow-[0_1px_2px_0_rgba(139,92,246,0.10)] transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:shadow-none focus-visible:ring-3 focus-visible:ring-violet-500/10 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-white disabled:text-slate-300 disabled:placeholder:text-slate-300 aria-invalid:ring-3',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
