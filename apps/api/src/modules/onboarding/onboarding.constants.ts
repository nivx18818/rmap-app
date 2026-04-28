export interface GoalSuggestion {
  label: string;
  roleCategory: string;
  description: string;
  estimatedWeeks: number;
}

export const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  {
    label: 'Backend Intern',
    roleCategory: 'Backend',
    description: 'Build production-grade REST APIs and understand server-side fundamentals.',
    estimatedWeeks: 16,
  },
  {
    label: 'Frontend Developer',
    roleCategory: 'Frontend',
    description: 'Master React, CSS architecture, and modern web performance.',
    estimatedWeeks: 16,
  },
  {
    label: 'iOS Developer',
    roleCategory: 'Mobile',
    description: 'Learn Swift, UIKit, SwiftUI, and publish apps to the App Store.',
    estimatedWeeks: 24,
  },
  {
    label: 'DevOps Engineer',
    roleCategory: 'DevOps',
    description: 'Master CI/CD pipelines, Docker, Kubernetes, and cloud infrastructure.',
    estimatedWeeks: 20,
  },
  {
    label: 'Data Analyst',
    roleCategory: 'Data',
    description: 'Learn SQL, Python, Pandas, and data visualization tools like Tableau.',
    estimatedWeeks: 16,
  },
];
