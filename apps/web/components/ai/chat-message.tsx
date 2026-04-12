import { ArtificialIntelligence01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import Image from 'next/image';

interface ChatAvatarProps {
  role: 'user' | 'ai';
  imageUrl?: string;
  className?: string;
}

export function ChatAvatar({ role, imageUrl, className }: ChatAvatarProps) {
  const isAi = role === 'ai';

  return (
    <div
      className={cn(
        'relative size-10 shrink-0 overflow-hidden rounded-full',
        isAi
          ? 'bg-background border border-[rgba(91,33,182,0.13)] shadow-[inset_0px_-3px_6px_-2px_#e7e6f4]'
          : 'bg-slate-200',
        className,
      )}
    >
      {isAi ? (
        <div className="flex size-full items-center justify-center p-2.5">
          <HugeiconsIcon
            className="text-foreground size-full"
            icon={ArtificialIntelligence01Icon}
          />
        </div>
      ) : imageUrl ? (
        <Image className="object-cover" src={imageUrl} alt="User" fill />
      ) : (
        <div className="flex size-full items-center justify-center text-xs font-bold text-slate-500 uppercase">
          YOU
        </div>
      )}
    </div>
  );
}

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  options?: string[];
  className?: string;
}

export function ChatMessage({ role, content, options, className }: ChatMessageProps) {
  const isAi = role === 'ai';

  return (
    <div className={cn('flex w-full items-start gap-3', !isAi && 'flex-row-reverse', className)}>
      <ChatAvatar role={role} />

      <div className={cn('flex max-w-[80%] flex-col gap-3', !isAi && 'items-end')}>
        <div
          className={cn(
            'relative rounded-[8px] p-3 text-base tracking-normal',
            isAi ? 'bg-background-secondary' : 'bg-gray-200',
          )}
        >
          {content}
        </div>

        {/* Options Buttons */}
        {isAi && options && options.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {options.map((option, idx) => (
              <Button key={idx} variant="outline" size="sm">
                {option}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatInput() {
  return (
    <div className="mt-auto flex w-full items-center pt-3">
      <div className="relative flex-1">
        <Input
          id="text"
          name="text"
          className="pr-10"
          placeholder="Type your answer..."
          type="text"
          autoComplete="off"
        />
        <button
          className="text-primary absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center transition-transform hover:scale-110"
          type="button"
        >
          <HugeiconsIcon className="size-full" icon={SentIcon} />
        </button>
      </div>
    </div>
  );
}

export function ChatLoading() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex w-full items-start gap-3 duration-300">
      <ChatAvatar className="opacity-50" role="ai" />
      <div className="bg-background-secondary flex items-center gap-1.5 rounded-[8px] px-4 py-3">
        <span className="bg-muted-foreground/30 size-1.5 animate-bounce rounded-full" />
        <span className="bg-muted-foreground/30 size-1.5 animate-bounce rounded-full [animation-delay:0.2s]" />
        <span className="bg-muted-foreground/30 size-1.5 animate-bounce rounded-full [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
