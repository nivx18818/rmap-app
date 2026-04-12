import { cn } from '@repo/design-system/lib/utils';

interface RainbowBarProps {
  className?: string;
  rotate?: number;
}

export function RainbowBar({ className, rotate = 3 }: RainbowBarProps) {
  return (
    <div
      className={cn(
        'absolute -top-16 -left-12 flex h-20 w-[110%] items-center justify-center',
        className,
      )}
      aria-hidden="true"
    >
      <div className={`rotate-${rotate} h-full w-full`}>
        <div className="h-full w-full bg-linear-to-r from-[#7dd3fc] via-[#a5b4fc] to-[#f9a8d4] blur-[32px]" />
      </div>
    </div>
  );
}
