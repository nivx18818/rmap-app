import { cn } from '@repo/design-system/lib/utils';

type RainbowBarRotate = 3 | 12;

const ROTATE_CLASS_BY_VALUE = {
  3: 'rotate-[3deg]',
  12: 'rotate-[12deg]',
} as const satisfies Record<RainbowBarRotate, string>;

interface RainbowBarProps {
  className?: string;
  rotate?: RainbowBarRotate;
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
      <div className={cn('h-full w-full', ROTATE_CLASS_BY_VALUE[rotate])}>
        <div className="landing-rainbow-bar h-full w-full" />
      </div>
    </div>
  );
}
