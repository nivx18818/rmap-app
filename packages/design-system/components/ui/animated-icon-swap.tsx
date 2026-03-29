'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';

interface AnimatedIconSwapProps {
  /**
   * The initial icon to display (e.g., ArrowRight).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  /**
   * The icon to display on hover (e.g., ArrowRight02).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hoverIcon: any;
  /**
   * Additional className for the container div.
   */
  className?: string;
  /**
   * The Tailwind group name to trigger the hover effect.
   * Defaults to 'button' to match the design system's Button component.
   */
  groupName?: string;
}

/**
 * A component that swaps between two icons with a sophisticated width-expansion transition.
 * Designed to be used inside a Button or any element with a `group/{groupName}` class.
 * This component handles the width expansion which makes the parent Button grow smoothly.
 */
export function AnimatedIconSwap({
  icon: Icon,
  hoverIcon: HoverIcon,
  className,
  groupName = 'btn',
}: AnimatedIconSwapProps) {
  return (
    <div
      className={cn(
        'flex items-center opacity-50 transition-opacity duration-300',
        groupName === 'btn'
          ? 'group-hover/btn:opacity-100'
          : `group-hover/${groupName}:opacity-100`,
        className,
      )}
    >
      {/* The hover icon starts with w-0 and expands to w-4 */}
      <HugeiconsIcon
        className={cn(
          'h-4! w-0! transform-gpu! overflow-hidden transition-all! duration-300! ease-out!',
          groupName === 'btn'
            ? 'group-hover/btn:w-4! group-hover/btn:translate-x-2.5!'
            : `group-hover/${groupName}:w-4! group-hover/${groupName}:translate-x-2.5!`,
        )}
        icon={HoverIcon}
      />
      {/* The initial icon hides on hover */}
      <HugeiconsIcon
        className={cn(
          'size-4! transform-gpu! transition-all! duration-200! ease-out!',
          groupName === 'btn'
            ? 'group-hover/btn:-translate-x-2.5! group-hover/button:opacity-0!'
            : `group-hover/${groupName}:-translate-x-2.5! group-hover/${groupName}:opacity-0!`,
        )}
        icon={Icon}
      />
    </div>
  );
}
