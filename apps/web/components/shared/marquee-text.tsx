'use client';

import type { CSSProperties } from 'react';

import { cn } from '@repo/design-system/lib/utils';
import { useEffect, useRef, useState } from 'react';

import { HighlightedText } from './highlighted-text';

interface MarqueeTextProps {
  className?: string;
  highlightQuery?: string;
  text: string;
  textClassName?: string;
}

export function MarqueeText({ className, highlightQuery, text, textClassName }: MarqueeTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [marqueeDistance, setMarqueeDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateMarqueeDistance = () => {
      setMarqueeDistance(Math.max(0, content.scrollWidth - container.clientWidth));
    };

    updateMarqueeDistance();

    const resizeObserver = new ResizeObserver(updateMarqueeDistance);
    resizeObserver.observe(container);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [highlightQuery, text]);

  const shouldMarquee = marqueeDistance > 0;
  const marqueeDuration = Math.max(4, marqueeDistance / 24);

  return (
    <p
      ref={containerRef}
      className={cn('max-w-full overflow-hidden text-center whitespace-nowrap', className)}
    >
      <style>
        {`
          @keyframes roadmap-node-marquee {
            0%, 18% { transform: translateX(0); }
            82%, 100% { transform: translateX(var(--roadmap-node-marquee-distance)); }
          }
        `}
      </style>
      <span
        ref={contentRef}
        className={cn('inline-block max-w-none', textClassName)}
        style={
          shouldMarquee
            ? ({
                animation: `roadmap-node-marquee ${marqueeDuration}s ease-in-out infinite alternate`,
                '--roadmap-node-marquee-distance': `-${marqueeDistance}px`,
              } as CSSProperties)
            : undefined
        }
      >
        <HighlightedText query={highlightQuery} text={text} />
      </span>
    </p>
  );
}
