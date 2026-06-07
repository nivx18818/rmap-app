'use client';

import { cn } from '@repo/design-system/lib/utils';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({
  className,
  position = 'top-center',
  toastOptions,
  ...props
}: ToasterProps) {
  return (
    <Sonner
      className={cn('toaster group', className)}
      position={position}
      toastOptions={{
        ...toastOptions,
        classNames: {
          actionButton:
            '!border-primary/20 !bg-primary !text-primary-foreground shadow-sm transition-colors hover:!bg-primary-active',
          cancelButton:
            '!border-border !bg-secondary !text-secondary-foreground transition-colors hover:!bg-btn-secondary-background-active',
          closeButton:
            '!border-border !bg-background !text-muted-foreground shadow-sm transition-colors hover:!bg-muted hover:!text-foreground',
          content: 'flex flex-col gap-1',
          description: 'font-sans text-sm leading-5 !text-muted-foreground',
          error: '!border-destructive/25 !bg-destructive/10 !text-destructive',
          icon: 'text-current',
          info: '!border-primary/20 !bg-primary/10 !text-primary',
          success:
            '!border-featured-template-recommended/25 !bg-featured-template-recommended/10 !text-featured-template-recommended',
          title: 'font-heading text-sm leading-5 font-medium',
          toast:
            'group toast !border-border !bg-popover/95 font-sans !text-popover-foreground !shadow-[0_18px_42px_hsla(262,70%,32%,0.12)] ring-1 ring-foreground/10 backdrop-blur-md !rounded-xl !px-4 !py-3.5 focus-visible:ring-3 focus-visible:ring-ring/50 data-[type=error]:[&_[data-icon]]:!text-destructive data-[type=info]:[&_[data-icon]]:!text-primary data-[type=success]:[&_[data-icon]]:!text-featured-template-recommended data-[type=warning]:[&_[data-icon]]:!text-chart-4',
          warning: '!border-chart-4/30 !bg-chart-4/15 !text-foreground',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}
