import type { ReactNode } from 'react';

interface HighlightedTextProps {
  className?: string;
  query?: string;
  text: string;
}

function getHighlightedParts(text: string, query?: string): ReactNode {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return text;

  const normalizedText = text.toLowerCase();
  const parts: ReactNode[] = [];
  let currentIndex = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery);

  while (matchIndex !== -1) {
    if (matchIndex > currentIndex) {
      parts.push(text.slice(currentIndex, matchIndex));
    }

    const matchEndIndex = matchIndex + normalizedQuery.length;
    parts.push(
      <mark
        key={`${matchIndex}-${matchEndIndex}`}
        className="rounded-xs bg-amber-300/85 px-0.5 text-zinc-950"
      >
        {text.slice(matchIndex, matchEndIndex)}
      </mark>,
    );

    currentIndex = matchEndIndex;
    matchIndex = normalizedText.indexOf(normalizedQuery, currentIndex);
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts;
}

export function HighlightedText({ className, query, text }: HighlightedTextProps) {
  return <span className={className}>{getHighlightedParts(text, query)}</span>;
}
