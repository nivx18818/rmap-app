import type { TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import {
  NodeQuizGenerationUnavailableException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';

import {
  MOCK_AI_ROADMAP,
  MOCK_DTO,
  MOCK_SKILL_MAP,
  MOCK_SKILL_PREREQUISITES,
} from '../../utils/roadmaps.mock';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('dummy-key') },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const baseInput = {
    goal: MOCK_DTO.goal,
    roleCategory: MOCK_DTO.roleCategory,
    hoursPerDay: MOCK_DTO.hoursPerDay,
    deadlineDate: MOCK_DTO.deadlineDate,
    quizAnswers: MOCK_DTO.quizAnswers,
    skillMap: MOCK_SKILL_MAP,
    prerequisites: MOCK_SKILL_PREREQUISITES,
  };
  const generatedQuizQuestions = Array.from({ length: 8 }, (_, index) => ({
    questionText: `Generated question ${index + 1}?`,
    optionA: `Generated option A ${index + 1}`,
    optionB: `Generated option B ${index + 1}`,
    optionC: `Generated option C ${index + 1}`,
    optionD: `Generated option D ${index + 1}`,
    correctOption: 'A' as const,
  }));

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRoadmap', () => {
    it('should return raw text from Gemini on success', async () => {
      jest.spyOn(service, 'generateContent').mockResolvedValue(JSON.stringify(MOCK_AI_ROADMAP));

      const result = await service.generateRoadmap(baseInput);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.generateContent).toHaveBeenCalledTimes(1);
      expect(result).toBe(JSON.stringify(MOCK_AI_ROADMAP));
    });

    it('should throw RoadmapGenerationUnavailableException when generateContent throws', async () => {
      jest.spyOn(service, 'generateContent').mockRejectedValue(new Error('Network error'));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should include skillMap, prerequisites, and quizAnswers in the prompt sent to AiService', async () => {
      const spy = jest
        .spyOn(service, 'generateContent')
        .mockResolvedValue(JSON.stringify(MOCK_AI_ROADMAP));

      await service.generateRoadmap(baseInput);

      const promptArg = spy.mock.calls[0]?.[0] as string;
      expect(promptArg).toContain('Leaf skill catalog JSON array');
      expect(promptArg).toContain('HTTP & REST');
      expect(promptArg).toContain('Skill prerequisite graph JSON array');
      expect(promptArg).toContain('prerequisiteSkillId');
      expect(promptArg).toContain('Node.js Basics');
      expect(promptArg).toContain('What is your current backend experience level?');
      expect(promptArg).toContain(baseInput.goal);
    });
  });

  describe('generateNodeQuiz', () => {
    it('should return validated node quiz questions on success', async () => {
      const spy = jest.spyOn(service, 'generateContent').mockResolvedValue(
        JSON.stringify({
          questions: generatedQuizQuestions,
        }),
      );

      const result = await service.generateNodeQuiz({
        name: 'HTTP & REST',
        description: 'Design HTTP APIs',
        roleCategory: 'WEB_DEVELOPMENT',
      });

      expect(result).toEqual(generatedQuizQuestions);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Generate exactly 8'), {
        temperature: 0.2,
      });
    });

    it('should throw NodeQuizGenerationUnavailableException on invalid AI quiz output', async () => {
      jest.spyOn(service, 'generateContent').mockResolvedValue(
        JSON.stringify({
          questions: generatedQuizQuestions.slice(0, 7),
        }),
      );

      await expect(
        service.generateNodeQuiz({
          name: 'HTTP & REST',
          description: 'Design HTTP APIs',
          roleCategory: 'WEB_DEVELOPMENT',
        }),
      ).rejects.toThrow(NodeQuizGenerationUnavailableException);
    });
  });
});
