import { Injectable } from '@nestjs/common';

import type { GoalSuggestion } from './constants/goal-suggestions';

import { GOAL_SUGGESTIONS } from './constants/goal-suggestions';

@Injectable()
export class OnboardingService {
  getGoalSuggestions(roleCategory?: string): GoalSuggestion[] {
    if (!roleCategory) {
      return GOAL_SUGGESTIONS;
    }
    return GOAL_SUGGESTIONS.filter(
      (goal) => goal.roleCategory.toLowerCase() === roleCategory.toLowerCase(),
    );
  }
}
