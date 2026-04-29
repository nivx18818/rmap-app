import type { TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { Context, MockContext } from '../../utils/prisma-mock';

import { createMockContext, resetMockContext } from '../../utils/prisma-mock';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let mockCtx: MockContext;
  let ctx: Context;

  beforeEach(async () => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: ctx.prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    resetMockContext(mockCtx);
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
      const payload = { topic: 'learn backend', hoursPerDay: 2, durationMonths: 3 };
      mockCtx.prisma.skill.findMany.mockResolvedValue([{ roleCategory: 'BACKEND' }]);
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') {
          return 'test-key';
        }
        if (key === 'GEMINI_MODEL') {
          return 'gemini-1.5-flash';
        }
        return undefined;
      });

      const quizResponse = {
        role_category: 'backend',
        estimated_intensity: 'High',
        questions: [{ question: 'Goal?', possibleAnswers: ['Career', 'Project'] }],
      };

      const fetchMock = jest.spyOn(
        globalThis as unknown as { fetch: (...args: unknown[]) => Promise<unknown> },
        'fetch',
      );
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(quizResponse) }] } }],
        }),
      } as { ok: boolean; json: () => Promise<unknown> });

      const result = await service.generateQuiz(payload);

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
        where: { roleCategory: { not: null } },
        distinct: ['roleCategory'],
        select: { roleCategory: true },
      });
      expect(fetchMock).toHaveBeenCalled();
      expect(result).toEqual(quizResponse);
    });

    it('should throw ExternalServiceErrorException when API key is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      mockCtx.prisma.skill.findMany.mockResolvedValue([{ roleCategory: 'FRONTEND' }]);

      await expect(service.generateQuiz({ topic: 'frontend' })).rejects.toThrow(
        ExternalServiceErrorException,
      );
    });
  });
});
