'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import { useState } from 'react';

type PasswordInputProps = React.ComponentProps<'input'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} className={cn('pr-10', className)} type={isVisible ? 'text' : 'password'} />
      <button
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-md transition-colors outline-none focus-visible:ring-2"
        type="button"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? (
          <EyeSlashIcon className="size-4 sm:size-5" />
        ) : (
          <EyeIcon className="size-4 sm:size-5" />
        )}
      </button>
    </div>
  );
}
