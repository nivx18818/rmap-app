import { Injectable } from '@nestjs/common';

export interface GoalSuggestion {
  label: string;
  role_category: string;
  description: string;
  estimated_weeks: number;
}

const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  {
    label: 'Backend Intern',
    role_category: 'Backend',
    description: 'Build production-grade REST APIs and understand server-side fundamentals.',
    estimated_weeks: 16,
  },
  {
    label: 'Frontend Developer',
    role_category: 'Frontend',
    description: 'Master React, CSS architecture, and modern web performance.',
    estimated_weeks: 16,
  },
  {
    label: 'iOS Developer',
    role_category: 'Mobile',
    description: 'Learn Swift, UIKit, SwiftUI, and publish apps to the App Store.',
    estimated_weeks: 24,
  },
  {
    label: 'DevOps Engineer',
    role_category: 'DevOps',
    description: 'Master CI/CD pipelines, Docker, Kubernetes, and cloud infrastructure.',
    estimated_weeks: 20,
  },
  {
    label: 'Data Analyst',
    role_category: 'Data',
    description: 'Learn SQL, Python, Pandas, and data visualization tools like Tableau.',
    estimated_weeks: 16,
  },
];

@Injectable()
export class OnboardingService {
  getGoalSuggestions(roleCategory?: string): GoalSuggestion[] {
    if (!roleCategory) {
      return GOAL_SUGGESTIONS;
    }
    return GOAL_SUGGESTIONS.filter(
      (goal) => goal.role_category.toLowerCase() === roleCategory.toLowerCase(),
    );
  }
}
