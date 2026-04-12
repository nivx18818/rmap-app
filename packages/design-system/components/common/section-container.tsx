import { cn } from '@repo/design-system/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * A layout primitive that provides a centered, max-width container with responsive padding.
 * Use this to wrap sections and keep content aligned.
 */
export function SectionContainer({ children, className, as: Tag = 'div' }: SectionContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full max-w-300 px-4 sm:px-6 lg:px-8', className)}>{children}</Tag>
  );
}
