import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';

import { OnboardingQuizRequestDto } from './dto/onboarding-quiz-request.dto';
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

  @Public()
  @Post('quiz')
  async createQuiz(@Body() body: OnboardingQuizRequestDto) {
    return await this.onboardingService.generateQuiz(body);
  }
}
