/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { OnboardingController } from '@/modules/onboarding/onboarding.controller';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let service: OnboardingService;

  const mockSuggestions = [
    {
      label: 'Backend Intern',
      roleCategory: 'Backend',
      description: 'Test description',
      estimatedWeeks: 16,
    },
  ];

  const mockOnboardingService = {
    getGoalSuggestions: jest.fn().mockReturnValue(mockSuggestions),
    generateQuiz: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: mockOnboardingService,
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
    service = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGoals', () => {
    it('should call getGoalSuggestions and return suggestions without query param', () => {
      const result = controller.getGoals();
      expect(service.getGoalSuggestions).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ suggestions: mockSuggestions });
    });

    it('should call getGoalSuggestions with query param', () => {
      const result = controller.getGoals({ roleCategory: 'Backend' });
      expect(service.getGoalSuggestions).toHaveBeenCalledWith('Backend');
      expect(result).toEqual({ suggestions: mockSuggestions });
    });
  });

  describe('createQuiz', () => {
    it('should call generateQuiz and return result', async () => {
      const mockResponse = {
        roleCategory: 'backend',
        questions: [{ question: 'Goal?', possibleAnswers: ['Career'] }],
      };
      mockOnboardingService.generateQuiz.mockResolvedValue(mockResponse);

      const result = await controller.createQuiz({ topic: 'backend' });

      expect(service.generateQuiz).toHaveBeenCalledWith({ topic: 'backend' });
      expect(result).toEqual(mockResponse);
    });
  });
});
