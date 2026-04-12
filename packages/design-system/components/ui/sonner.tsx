'use client';

import { cn } from '@repo/design-system/lib/utils';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ className, ...props }: ToasterProps) {
  return (
    <Sonner
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:font-sans',
          title: 'group-[.toast]:font-sans',
          toast:
            'group toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:font-sans group-[.toaster]:text-foreground group-[.toaster]:shadow-lg',
        },
      }}
      {...props}
    />
  );
}
