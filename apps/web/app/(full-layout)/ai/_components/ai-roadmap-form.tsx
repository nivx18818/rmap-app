'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert02Icon,
  ArrowRight,
  ArrowRight02FreeIcons,
  Book02Icon,
  Calendar01Icon,
  Coffee02Icon,
  FireIcon,
  Rocket02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Calendar } from '@repo/design-system/components/ui/calendar';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/design-system/components/ui/popover';
import { Slider } from '@repo/design-system/components/ui/slider';
import { cn } from '@repo/design-system/lib/utils';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  stepOneSchema,
  type StepOneValues,
} from '@/app/(full-layout)/ai/_validations/ai-roadmap.schema';

import { DEFAULT_HOURS_PER_DAY } from '../_hooks/use-onboarding-wizard';
import { GoalSuggestionChips } from './goal-suggestion-chips';

interface AiRoadmapFormProps {
  initialData: { goal: string; hours_per_day: number; deadline_date: string };
  onNext: (data: { goal: string; hours_per_day: number; deadline_date: string }) => void;
}

const getIntensityConfig = (hours: number) => {
  if (hours <= 2)
    return {
      color: '#10b981',
      indicatorColor: '#10b981',
      label: 'Relaxed Pace',
      description: 'Steady and easy. Great for balancing with a full-time job.',
      icon: Coffee02Icon,
    };
  if (hours <= 4)
    return {
      color: '#3b82f6',
      indicatorColor: '#3b82f6',
      label: 'Focused',
      description: 'Solid progress. Recommended for part-time learners.',
      icon: Book02Icon,
    };
  if (hours <= 8)
    return {
      color: '#f97316',
      indicatorColor: '#f97316',
      label: 'Intensive',
      description: 'Fast track. Suitable if you are studying full-time.',
      icon: Rocket02Icon,
    };
  if (hours <= 12)
    return {
      color: '#ef4444',
      indicatorColor: '#ef4444',
      label: 'Extreme',
      description: 'Very high commitment. Make sure to schedule breaks to avoid burnout.',
      icon: FireIcon,
    };
  return {
    color: '#a855f7',
    indicatorColor: '#a855f7',
    label: 'Unrealistic',
    description: 'Warning: 12+ hours daily is generally unsustainable and leads to severe burnout.',
    icon: Alert02Icon,
  };
};

export function AiRoadmapForm({ initialData, onNext }: AiRoadmapFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  const [hours, setHours] = useState(initialData.hours_per_day ?? DEFAULT_HOURS_PER_DAY);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSuggestionSelect = (goal: string) => {
    setValue('goal', goal, { shouldValidate: true });
  };

  const deadlineStr = watch('deadline_date');
  const deadlineDate = deadlineStr ? new Date(deadlineStr) : undefined;
  const intensity = useMemo(() => getIntensityConfig(hours), [hours]);

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <FieldGroup className="flex flex-col gap-8">
        <Field data-invalid={!!errors.goal}>
          <FieldLabel className="text-base font-normal" htmlFor="goal">
            What do you want to learn?
          </FieldLabel>
          <Input
            id="goal"
            placeholder="Enter any topic that you want to learn"
            type="text"
            autoComplete="off"
            {...register('goal')}
            className="mt-2"
            aria-invalid={!!errors.goal}
          />
          <FieldError errors={[errors.goal]} />
          <GoalSuggestionChips onSelect={handleSuggestionSelect} />
        </Field>

        <Field data-invalid={!!errors.hours_per_day}>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-base font-normal">Daily study hours</FieldLabel>
            <Badge
              variant="outline"
              style={{ color: intensity.color }}
              className={cn('text-sm font-medium transition-colors')}
            >
              ~ {hours} {hours === 1 ? 'hour' : 'hours'} / day
            </Badge>
          </div>
          <div style={{ '--slider-color': intensity.color } as React.CSSProperties}>
            <Slider
              className="mt-2"
              min={1}
              max={16}
              step={1}
              defaultValue={initialData.hours_per_day ?? DEFAULT_HOURS_PER_DAY}
              onValueChange={(val) => {
                const h =
                  typeof val === 'number' ? val : ((val as number[])[0] ?? DEFAULT_HOURS_PER_DAY);
                setHours(h);
                setValue('hours_per_day', h, { shouldValidate: true });
              }}
            />
          </div>
          <FieldError className="mt-2" errors={[errors.hours_per_day]} />
        </Field>

        <div className="border-border/60 bg-background-secondary/40 flex items-start gap-3 rounded-xl border p-3.5 shadow-sm transition-all duration-300">
          <div
            style={{ backgroundColor: intensity.color }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors duration-300"
          >
            <HugeiconsIcon className="size-4.5" icon={intensity.icon} />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm leading-tight font-medium">{intensity.label}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {intensity.description}
            </p>
          </div>
        </div>

        <Field data-invalid={!!errors.deadline_date}>
          <FieldLabel className="text-base font-normal">When is your deadline?</FieldLabel>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    'mt-2 w-full justify-start text-left font-normal',
                    !deadlineDate && 'text-muted-foreground',
                  )}
                />
              }
            >
              <HugeiconsIcon className="mr-2" icon={Calendar01Icon} />
              {deadlineDate ? format(deadlineDate, 'PPP') : <span>Pick a deadline date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                fromMonth={new Date()}
                toYear={new Date().getFullYear() + 10}
                mode="single"
                captionLayout="dropdown"
                initialFocus
                selected={deadlineDate}
                onSelect={(date) => {
                  setValue('deadline_date', date ? date.toISOString() : '', {
                    shouldValidate: true,
                  });
                  setPopoverOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <FieldError errors={[errors.deadline_date]} />
        </Field>

        <Button size="lg" className="group/btn mt-2 w-full" type="submit" disabled={!isValid}>
          Next step
          <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
        </Button>
      </FieldGroup>
    </form>
  );
}
