import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';

import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Get('goals')
  getGoals(
    @Query()
    query: { roleCategory?: string } = {},
  ) {
    const roleCategory = query.roleCategory;
    const suggestions = this.onboardingService.getGoalSuggestions(roleCategory);
    return { suggestions };
  }
}
