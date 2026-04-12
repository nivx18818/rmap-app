import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';

export function LoadingState() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-1">
      <div className="relative size-40 sm:size-48">
        <Image
          className="animate-pulse object-contain"
          src="/ai-loading-image.png"
          alt="Generating questions"
          fill
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon className="text-primary size-5 animate-spin" icon={Loading03Icon} />
          <span className="text-foreground text-base font-medium tracking-tight">
            Generating personalized questions...
          </span>
        </div>
        <p className="text-muted-foreground max-w-[70%] text-center text-sm leading-relaxed">
          Our AI is analyzing your topic to create the most effective learning path for you.
        </p>
      </div>
    </div>
  );
}
