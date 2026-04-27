import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { OnboardingService } from '@/modules/onboarding/onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnboardingService],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGoalSuggestions', () => {
    it('should return all suggestions when no roleCategory is provided', () => {
      const suggestions = service.getGoalSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.role_category === 'Backend')).toBeTruthy();
      expect(suggestions.some((s) => s.role_category === 'Frontend')).toBeTruthy();
    });

    it('should return only backend suggestions when roleCategory is Backend', () => {
      const suggestions = service.getGoalSuggestions('Backend');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.role_category === 'Backend')).toBeTruthy();
    });

    it('should return empty array if no suggestions for a category', () => {
      const suggestions = service.getGoalSuggestions('UnknownRole');
      expect(suggestions).toEqual([]);
    });

    it('should be case-insensitive for role category', () => {
      const suggestions = service.getGoalSuggestions('bacKeNd');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.role_category === 'Backend')).toBeTruthy();
    });
  });
});
