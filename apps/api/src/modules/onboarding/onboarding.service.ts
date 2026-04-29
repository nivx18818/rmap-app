import { Injectable } from '@nestjs/common';

import type { GoalSuggestion } from '../../common/constants/onboarding.constants';

import { GOAL_SUGGESTIONS } from '../../common/constants/onboarding.constants';

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
