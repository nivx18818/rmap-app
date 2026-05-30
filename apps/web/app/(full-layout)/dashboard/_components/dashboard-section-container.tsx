import type { PropsWithChildren } from 'react';

import { cn } from '@repo/design-system/lib/utils';

interface DashboardSectionContainerProps extends PropsWithChildren {
  className?: string;
}

export function DashboardSectionContainer({ children, className }: DashboardSectionContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-470 px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  );
}
