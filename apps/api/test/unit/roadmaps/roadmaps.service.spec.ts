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
            roadmapNode: { findMany: jest.fn(), findFirst: jest.fn() },
            quizQuestion: { findMany: jest.fn() },
            userNodeProgress: { upsert: jest.fn() },
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
    const roadmapId = 'roadmap-1';

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

      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {});

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roadmapId, roadmap: { userId: MOCK_USER_ID } },
        }),
      );
      expect(result).toEqual({
        nodes: [
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
            progress: null,
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
            progress: {
              id: 'progress-1',
              roadmapNodeId: 'node-2',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: 80,
              quizPassed: true,
            },
          },
        ],
      });
    });

    it('should filter by status on leaf nodes', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, roadmapId, { status: NodeStatus.COMPLETED });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roadmapId,
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

      await service.listNodes(MOCK_USER_ID, roadmapId, { q: 'REST' });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roadmapId,
            name: { contains: 'REST', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should return empty when status is set for non-leaf nodeType', async () => {
      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {
        nodeType: NodeType.GROUP,
        status: NodeStatus.COMPLETED,
      });

      expect(result).toEqual({ nodes: [] });
      expect(prisma.roadmapNode.findMany).not.toHaveBeenCalled();
    });
  });

  describe('submitQuiz', () => {
    const roadmapId = 'roadmap-1';
    const nodeId = 'node-1';
    const skillId = 'skill-1';

    beforeEach(() => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
      });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: '11111111-1111-1111-1111-111111111111', correctOption: 'A' },
        { id: '22222222-2222-2222-2222-222222222222', correctOption: 'B' },
        { id: '33333333-3333-3333-3333-333333333333', correctOption: 'C' },
        { id: '44444444-4444-4444-4444-444444444444', correctOption: 'D' },
        { id: '55555555-5555-5555-5555-555555555555', correctOption: 'A' },
      ]);
      prisma.userNodeProgress.upsert.mockResolvedValue({
        id: 'progress-1',
        roadmapNodeId: nodeId,
        status: NodeStatus.IN_PROGRESS,
        startedAt: new Date('2026-01-01T00:00:00Z'),
        completedAt: null,
        quizScorePct: 80,
        quizPassed: true,
      });
    });

    it('should return score details, reveal correct options, and updated node progress', async () => {
      const result = await service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' },
          { question_id: '22222222-2222-2222-2222-222222222222', selected_option: 'B' },
          { question_id: '33333333-3333-3333-3333-333333333333', selected_option: 'D' },
          { question_id: '44444444-4444-4444-4444-444444444444', selected_option: 'D' },
          { question_id: '55555555-5555-5555-5555-555555555555', selected_option: 'A' },
        ],
      });

      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
        where: {
          id: nodeId,
          roadmapId,
          roadmap: { userId: MOCK_USER_ID },
        },
        select: {
          id: true,
          nodeType: true,
          skillId: true,
        },
      });
      expect(prisma.userNodeProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_roadmapNodeId: {
              userId: MOCK_USER_ID,
              roadmapNodeId: nodeId,
            },
          },
          update: {
            quizScorePct: 80,
            quizPassed: true,
          },
        }),
      );
      expect(result.score_pct).toBe(80);
      expect(result.passed).toBe(true);
      expect(result.correct_count).toBe(4);
      expect(result.total_questions).toBe(5);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            question_id: '33333333-3333-3333-3333-333333333333',
            selected_option: 'D',
            correct_option: 'C',
            is_correct: false,
          }),
        ]),
      );
      expect(result.suggestion).toBeNull();
      expect(result.node_progress).toEqual({
        id: 'progress-1',
        roadmap_node_id: nodeId,
        status: NodeStatus.IN_PROGRESS,
        started_at: new Date('2026-01-01T00:00:00Z'),
        completed_at: null,
        quiz_score_pct: 80,
        quiz_passed: true,
      });
    });

    it('should return suggestion when score is below passing threshold', async () => {
      prisma.userNodeProgress.upsert.mockResolvedValue({
        id: 'progress-1',
        roadmapNodeId: nodeId,
        status: NodeStatus.IN_PROGRESS,
        startedAt: new Date('2026-01-01T00:00:00Z'),
        completedAt: null,
        quizScorePct: 40,
        quizPassed: false,
      });

      const result = await service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' },
          { question_id: '22222222-2222-2222-2222-222222222222', selected_option: 'A' },
          { question_id: '33333333-3333-3333-3333-333333333333', selected_option: 'A' },
          { question_id: '44444444-4444-4444-4444-444444444444', selected_option: 'D' },
          { question_id: '55555555-5555-5555-5555-555555555555', selected_option: 'D' },
        ],
      });

      expect(prisma.userNodeProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            quizScorePct: 40,
            quizPassed: false,
          },
        }),
      );
      expect(result.passed).toBe(false);
      expect(result.suggestion).toBe('You should review this part before continuing.');
    });

    it('should overwrite previous quiz score on re-submission', async () => {
      await service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' },
          { question_id: '22222222-2222-2222-2222-222222222222', selected_option: 'A' },
          { question_id: '33333333-3333-3333-3333-333333333333', selected_option: 'A' },
          { question_id: '44444444-4444-4444-4444-444444444444', selected_option: 'A' },
          { question_id: '55555555-5555-5555-5555-555555555555', selected_option: 'A' },
        ],
      });

      await service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' },
          { question_id: '22222222-2222-2222-2222-222222222222', selected_option: 'B' },
          { question_id: '33333333-3333-3333-3333-333333333333', selected_option: 'C' },
          { question_id: '44444444-4444-4444-4444-444444444444', selected_option: 'D' },
          { question_id: '55555555-5555-5555-5555-555555555555', selected_option: 'A' },
        ],
      });

      expect(prisma.userNodeProgress.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          update: { quizScorePct: 40, quizPassed: false },
        }),
      );
      expect(prisma.userNodeProgress.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          update: { quizScorePct: 100, quizPassed: true },
        }),
      );
    });

    it('should throw 422 for group nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.GROUP,
        skillId: null,
      });

      await expect(
        service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: [{ question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' }],
        }),
      ).rejects.toThrow('Quiz submissions are only supported for required or optional nodes');
    });

    it('should throw 422 for milestone nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
      });

      await expect(
        service.submitQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: [{ question_id: '11111111-1111-1111-1111-111111111111', selected_option: 'A' }],
        }),
      ).rejects.toThrow('Quiz submissions are only supported for required or optional nodes');
    });
  });
});
