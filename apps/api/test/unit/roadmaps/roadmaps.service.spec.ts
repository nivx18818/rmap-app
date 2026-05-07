/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { NodeStatus, NodeType } from '@repo/db/prisma/client';

import {
  DeadlineInPastException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { DagreLayoutService } from '@/modules/roadmaps/dagre-layout.service';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

import {
  MOCK_USER_ID,
  MOCK_DTO,
  MOCK_SKILL_MAP as MOCK_SKILLS,
  MOCK_PRISMA_SKILL_PREREQUISITES,
  MOCK_SKILL_PREREQUISITES,
  MOCK_AI_ROADMAP as MOCK_AI_OUTPUT,
  MOCK_LAYOUT_MAP,
  MOCK_ROADMAP,
} from '../../utils/roadmaps.mock';

function makeTxMock() {
  return {
    roadmap: { create: jest.fn().mockResolvedValue(MOCK_ROADMAP) },
    roadmapNode: { createMany: jest.fn().mockResolvedValue({ count: 19 }) },
    userNodeProgress: {
      createMany: jest.fn().mockResolvedValue({ count: 19 }),
      updateMany: jest.fn().mockResolvedValue({ count: 4 }),
    },
  };
}

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let prisma: jest.Mocked<PrismaService>;
  let aiService: jest.Mocked<AiService>;
  let dagreLayout: jest.Mocked<DagreLayoutService>;

  beforeEach(async () => {
    const txMock = makeTxMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
        {
          provide: PrismaService,
          useValue: {
            skill: { findMany: jest.fn().mockResolvedValue(MOCK_SKILLS) },
            skillPrerequisite: {
              findMany: jest.fn().mockResolvedValue(MOCK_PRISMA_SKILL_PREREQUISITES),
            },
            roadmapNode: { findMany: jest.fn() },
            $transaction: jest
              .fn()
              .mockImplementation(async (fn: (tx: typeof txMock) => unknown) => await fn(txMock)),
          },
        },
        {
          provide: AiService,
          useValue: {
            generateRoadmap: jest.fn().mockResolvedValue(JSON.stringify(MOCK_AI_OUTPUT)),
          },
        },
        {
          provide: DagreLayoutService,
          useValue: { computeLayout: jest.fn().mockReturnValue(MOCK_LAYOUT_MAP) },
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
    dagreLayout = module.get(DagreLayoutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deadline validation', () => {
    it('should throw DeadlineInPastException for a past date', async () => {
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: '2000-01-01' }),
      ).rejects.toThrow(DeadlineInPastException);
    });

    it('should throw DeadlineInPastException for today', async () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: yesterday }),
      ).rejects.toThrow(DeadlineInPastException);
    });

    it('should NOT call Gemini when deadline is in the past', async () => {
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: '2000-01-01' }),
      ).rejects.toThrow();
      expect(aiService.generateRoadmap).not.toHaveBeenCalled();
    });
  });

  describe('timeline feasibility check', () => {
    it('should return timelineWarning=null when deadline is comfortably far', async () => {
      const result = await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(result.timelineWarning).toBeNull();
    });

    it('should return a timelineWarning when pace is >15% behind', async () => {
      // MOCK_SKILLS total = 24h, use a very near deadline + low hours/day
      const result = await service.generate(MOCK_USER_ID, {
        ...MOCK_DTO,
        deadlineDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10), // 2 days out
        hoursPerDay: 0.5, // only 1h available → way behind 24h
      });
      expect(result.timelineWarning).not.toBeNull();
      expect(result.timelineWarning!.isBehind).toBe(true);
      expect(result.timelineWarning!.paceDeficitPct).toBeGreaterThan(0);
      expect(result.timelineWarning!.estimatedDelayDays).toBeGreaterThan(0);
    });
  });

  describe('AI generation and parsing failure', () => {
    it('should propagate RoadmapGenerationUnavailableException from AiService', async () => {
      aiService.generateRoadmap.mockRejectedValue(new RoadmapGenerationUnavailableException());

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException on malformed JSON', async () => {
      aiService.generateRoadmap.mockResolvedValue('not-valid-json{{');

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when title is missing', async () => {
      const invalid = {
        description: 'ok',
        nodes: [{ name: 'X', nodeType: 'group', skillId: 'X' }],
      };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when nodes array is empty', async () => {
      const invalid = { title: 'T', description: 'D', nodes: [] };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
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
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
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
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });
  });

  describe('happy path', () => {
    it('should call skill.findMany with the correct roleCategory', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { roleCategory: MOCK_DTO.roleCategory } }),
      );
    });

    it('should load skill prerequisites for the selected role skills', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(prisma.skillPrerequisite.findMany).toHaveBeenCalledWith({
        where: {
          skillId: { in: MOCK_SKILLS.map((skill) => skill.id) },
          prerequisiteSkillId: { in: MOCK_SKILLS.map((skill) => skill.id) },
        },
        select: {
          skillId: true,
          prerequisiteSkillId: true,
          skill: { select: { name: true } },
          prerequisiteSkill: { select: { name: true } },
        },
      });
    });

    it('should pass prerequisites to AiService', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(aiService.generateRoadmap).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: MOCK_SKILL_PREREQUISITES,
        }),
      );
    });

    it('should call DagreLayoutService.computeLayout once', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(dagreLayout.computeLayout).toHaveBeenCalledTimes(1);
    });

    it('should return { roadmap, timelineWarning: null } on success', async () => {
      const result = await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.id).toBe(MOCK_ROADMAP.id);
      expect(result.timelineWarning).toBeNull();
    });

    it('should NOT include quiz answers in any Prisma call args', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      // Inspect all $transaction calls — none should contain quizAnswers
      const txCalls = (prisma.$transaction as jest.Mock).mock.calls;
      expect(txCalls.length).toBeGreaterThan(0);
      const txCallString = JSON.stringify(txCalls);
      // quizAnswers answers are free text strings 'A1'…'A7'
      expect(txCallString).not.toContain('quizAnswers');
    });
  });

  describe('listNodes', () => {
    it('should return nodes with embedded progress', async () => {
      const mockNodes = [
        {
          id: 'node-1',
          roadmapId: 'roadmap-1',
          parentId: null,
          skillId: null,
          name: 'Backend Foundations',
          description: null,
          nodeType: NodeType.GROUP,
          estimatedHours: null,
          posX: 120,
          posY: 200,
          userNodeProgress: [],
        },
        {
          id: 'node-2',
          roadmapId: 'roadmap-1',
          parentId: 'node-1',
          skillId: 'skill-1',
          name: 'REST API',
          description: null,
          nodeType: NodeType.REQUIRED,
          estimatedHours: 6,
          posX: 140,
          posY: 240,
          userNodeProgress: [
            {
              id: 'progress-1',
              userId: MOCK_USER_ID,
              roadmapNodeId: 'node-2',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: 80,
              quizPassed: true,
            },
          ],
        },
      ];

      prisma.roadmapNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.listNodes(MOCK_USER_ID, {});

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roadmap: { userId: MOCK_USER_ID } },
        }),
      );
      expect(result).toEqual({
        nodes: [
          {
            id: 'node-1',
            roadmap_id: 'roadmap-1',
            parent_id: null,
            skill_id: null,
            name: 'Backend Foundations',
            description: null,
            node_type: NodeType.GROUP,
            estimated_hours: null,
            pos_x: 120,
            pos_y: 200,
            progress: null,
          },
          {
            id: 'node-2',
            roadmap_id: 'roadmap-1',
            parent_id: 'node-1',
            skill_id: 'skill-1',
            name: 'REST API',
            description: null,
            node_type: NodeType.REQUIRED,
            estimated_hours: 6,
            pos_x: 140,
            pos_y: 240,
            progress: {
              id: 'progress-1',
              user_id: MOCK_USER_ID,
              roadmap_node_id: 'node-2',
              status: NodeStatus.COMPLETED,
              started_at: new Date('2026-01-01T00:00:00Z'),
              completed_at: new Date('2026-01-02T00:00:00Z'),
              quiz_score_pct: 80,
              quiz_passed: true,
            },
          },
        ],
      });
    });

    it('should filter by status on leaf nodes', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, { status: NodeStatus.COMPLETED });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nodeType: { in: [NodeType.REQUIRED, NodeType.OPTIONAL] },
            userNodeProgress: {
              some: {
                status: NodeStatus.COMPLETED,
                userId: MOCK_USER_ID,
              },
            },
          }),
        }),
      );
    });

    it('should apply case-insensitive name filtering', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, { q: 'REST' });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'REST', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should return empty when status is set for non-leaf node_type', async () => {
      const result = await service.listNodes(MOCK_USER_ID, {
        node_type: NodeType.GROUP,
        status: NodeStatus.COMPLETED,
      });

      expect(result).toEqual({ nodes: [] });
      expect(prisma.roadmapNode.findMany).not.toHaveBeenCalled();
    });
  });
});
