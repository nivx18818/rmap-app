import {
  Alert02Icon,
  Book02Icon,
  Coffee02Icon,
  FireIcon,
  Rocket02Icon,
} from '@hugeicons/core-free-icons';

export const INTENSITY_LEVELS = [
  {
    maxHours: 2,
    color: '#10b981',
    indicatorColor: '#10b981',
    label: 'Relaxed Pace',
    description: 'Steady and easy. Great for balancing with a full-time job.',
    icon: Coffee02Icon,
  },
  {
    maxHours: 4,
    color: '#3b82f6',
    indicatorColor: '#3b82f6',
    label: 'Focused',
    description: 'Solid progress. Recommended for part-time learners.',
    icon: Book02Icon,
  },
  {
    maxHours: 8,
    color: '#f97316',
    indicatorColor: '#f97316',
    label: 'Intensive',
    description: 'Fast track. Suitable if you are studying full-time.',
    icon: Rocket02Icon,
  },
  {
    maxHours: 12,
    color: '#ef4444',
    indicatorColor: '#ef4444',
    label: 'Extreme',
    description: 'Very high commitment. Make sure to schedule breaks to avoid burnout.',
    icon: FireIcon,
  },
  {
    maxHours: Infinity,
    color: '#a855f7',
    indicatorColor: '#a855f7',
    label: 'Unrealistic',
    description: 'Warning: 12+ hours daily is generally unsustainable and leads to severe burnout.',
    icon: Alert02Icon,
  },
] as const;

export const getIntensityConfig = (hours: number) => {
  return (
    INTENSITY_LEVELS.find((level) => hours <= level.maxHours) ??
    INTENSITY_LEVELS[INTENSITY_LEVELS.length - 1]!
  );
};
