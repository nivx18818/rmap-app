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
      <div className="h-full w-full" style={{ transform: `rotate(${rotate}deg)` }}>
        <div className="landing-rainbow-bar h-full w-full" />
      </div>
    </div>
  );
}
