import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let aiService: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: AiService,
          useValue: {
            generateContent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    aiService = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGoalSuggestions', () => {
    it('should return all suggestions when no roleCategory is provided', () => {
      const suggestions = service.getGoalSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.roleCategory === 'Backend')).toBeTruthy();
      expect(suggestions.some((s) => s.roleCategory === 'Frontend')).toBeTruthy();
    });

    it('should return only backend suggestions when roleCategory is Backend', () => {
      const suggestions = service.getGoalSuggestions('Backend');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.roleCategory === 'Backend')).toBeTruthy();
    });

    it('should return empty array if no suggestions for a category', () => {
      const suggestions = service.getGoalSuggestions('UnknownRole');
      expect(suggestions).toEqual([]);
    });

    it('should be case-insensitive for role category', () => {
      const suggestions = service.getGoalSuggestions('bacKeNd');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.roleCategory === 'Backend')).toBeTruthy();
    });
  });

  describe('generateQuiz', () => {
    it('should return quiz response from Gemini and normalized role category', async () => {
      const payload = { topic: 'learn backend' };

      const quizResponse = {
        roleCategory: 'backend',
        questions: [{ question: 'Goal?', possibleAnswers: ['Career', 'Project'] }],
      };

      jest.spyOn(aiService, 'generateContent').mockResolvedValue(JSON.stringify(quizResponse));

      const result = await service.generateQuiz(payload);

      expect(aiService.generateContent).toHaveBeenCalled();
      expect(result).toEqual(quizResponse);
    });

    it('should throw ExternalServiceErrorException when API key is missing', async () => {
      jest
        .spyOn(aiService, 'generateContent')
        .mockRejectedValue(new ExternalServiceErrorException('Gemini'));

      await expect(service.generateQuiz({ topic: 'frontend' })).rejects.toThrow(
        ExternalServiceErrorException,
      );
    });
  });
});
