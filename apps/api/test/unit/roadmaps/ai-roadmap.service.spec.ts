import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { RoadmapGenerationUnavailableException } from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { AiRoadmapService } from '@/modules/roadmaps/ai-roadmap.service';

import {
  MOCK_SKILL_MAP,
  MOCK_SKILL_PREREQUISITES,
  MOCK_AI_ROADMAP,
  MOCK_DTO,
} from '../../utils/roadmaps.mock';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AiRoadmapService', () => {
  let service: AiRoadmapService;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRoadmapService,
        {
          provide: AiService,
          useValue: { generateContent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AiRoadmapService>(AiRoadmapService);
    aiService = module.get(AiService);
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRoadmap', () => {
    it('should parse and return a valid AiRoadmapOutput on success', async () => {
      aiService.generateContent.mockResolvedValue(JSON.stringify(MOCK_AI_ROADMAP));

      const result = await service.generateRoadmap(baseInput);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(aiService.generateContent).toHaveBeenCalledTimes(1);
      expect(result.title).toBe(MOCK_AI_ROADMAP.title);
      expect(result.description).toBe(MOCK_AI_ROADMAP.description);
      expect(result.nodes).toHaveLength(6);
      expect(result.nodes[0]?.skillId).toBeUndefined();
      expect(result.nodes[0]?.children?.[0]?.skillId).toBe('skill-1');
    });

    it('should strip markdown fences before parsing JSON', async () => {
      aiService.generateContent.mockResolvedValue(
        '```json\n' + JSON.stringify(MOCK_AI_ROADMAP) + '\n```',
      );

      const result = await service.generateRoadmap(baseInput);
      expect(result.title).toBe(MOCK_AI_ROADMAP.title);
    });

    it('should throw RoadmapGenerationUnavailableException when AiService throws', async () => {
      aiService.generateContent.mockRejectedValue(new Error('Network error'));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException on malformed JSON', async () => {
      aiService.generateContent.mockResolvedValue('not-valid-json{{');

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when title is missing', async () => {
      const invalid = {
        description: 'ok',
        nodes: [{ name: 'X', nodeType: 'group', skillId: 'X' }],
      };
      aiService.generateContent.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when nodes array is empty', async () => {
      const invalid = { title: 'T', description: 'D', nodes: [] };
      aiService.generateContent.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when a group node has skillId', async () => {
      const invalid = {
        title: 'T',
        description: 'D',
        nodes: [
          {
            name: 'Backend Foundations',
            nodeType: 'group',
            skillId: 'skill-1',
            children: [{ name: 'HTTP & REST', nodeType: 'required', skillId: 'skill-1' }],
          },
        ],
      };
      aiService.generateContent.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when a leaf node has no skillId', async () => {
      const invalid = {
        title: 'T',
        description: 'D',
        nodes: [
          {
            name: 'Backend Foundations',
            nodeType: 'group',
            children: [{ name: 'HTTP & REST', nodeType: 'required' }],
          },
        ],
      };
      aiService.generateContent.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generateRoadmap(baseInput)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should include skillMap, prerequisites, and quizAnswers in the prompt sent to AiService', async () => {
      aiService.generateContent.mockResolvedValue(JSON.stringify(MOCK_AI_ROADMAP));

      await service.generateRoadmap(baseInput);

      const promptArg = aiService.generateContent.mock.calls[0]?.[0] as string;
      expect(promptArg).toContain('Leaf skill catalog JSON array');
      expect(promptArg).toContain('HTTP & REST');
      expect(promptArg).toContain('Skill prerequisite graph JSON array');
      expect(promptArg).toContain('prerequisiteSkillId');
      expect(promptArg).toContain('Node.js Basics');
      expect(promptArg).toContain('What is your current backend experience level?');
      expect(promptArg).toContain(baseInput.goal);
    });
  });
});
