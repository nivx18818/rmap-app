import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';

interface LoadingStateProps {
  className?: string;
  message?: string;
  description?: string;
}

export function LoadingState({ className, message, description }: LoadingStateProps) {
  return (
    <div
      className={`relative z-10 flex flex-col items-center gap-2 px-4 py-4 sm:gap-1 sm:px-0 ${className}`}
    >
      <div className="relative size-32 sm:size-40 md:size-48">
        <Image
          className="animate-pulse object-contain"
          src="/ai-loading-image.png"
          alt="Generating questions"
          fill
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            className="text-primary size-4 animate-spin sm:size-5"
            icon={Loading03Icon}
          />
          <span className="text-foreground text-sm font-medium tracking-tight sm:text-base">
            {message || 'Generating personalized questions...'}
          </span>
        </div>
        <p className="text-muted-foreground max-w-xs text-sm leading-relaxed sm:max-w-[70%]">
          {description ||
            'Our AI is analyzing your topic to create the most effective learning path for you.'}
        </p>
      </div>
    </div>
  );
}
