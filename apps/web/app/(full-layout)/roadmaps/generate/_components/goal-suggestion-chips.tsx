'use client';

import { Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';

import type { GoalSuggestion } from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';

import { onboardingService } from '@/services/onboarding-service';

interface GoalSuggestionChipsProps {
  onSelect: (goal: string) => void;
}

export function GoalSuggestionChips({ onSelect }: GoalSuggestionChipsProps) {
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeFetch = useRef<Promise<{ suggestions: GoalSuggestion[] }> | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSuggestions = async () => {
      try {
        if (!activeFetch.current) {
          activeFetch.current = onboardingService.getGoals();
        }

        const data = await activeFetch.current;

        if (mounted) {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to fetch goals', error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <span className="text-muted-foreground text-sm">Suggestions</span>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Badge
            key={suggestion.label}
            variant="secondary"
            className="hover:bg-secondary/80 flex cursor-pointer items-center gap-1.5 px-3 py-2"
            onClick={() => onSelect(suggestion.label)}
          >
            <HugeiconsIcon className="size-3.5" icon={Target02Icon} />
            {suggestion.label}
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              ~{suggestion.estimatedWeeks}w
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
