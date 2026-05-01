/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import {
  DeadlineInPastException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AiRoadmapService } from '@/modules/roadmaps/ai-roadmap.service';
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

// ---------------------------------------------------------------------------
// Prisma tx mock factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let prisma: jest.Mocked<PrismaService>;
  let aiRoadmapService: jest.Mocked<AiRoadmapService>;
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
            $transaction: jest
              .fn()
              .mockImplementation(async (fn: (tx: typeof txMock) => unknown) => await fn(txMock)),
          },
        },
        {
          provide: AiRoadmapService,
          useValue: { generateRoadmap: jest.fn().mockResolvedValue(MOCK_AI_OUTPUT) },
        },
        {
          provide: DagreLayoutService,
          useValue: { computeLayout: jest.fn().mockReturnValue(MOCK_LAYOUT_MAP) },
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
    prisma = module.get(PrismaService);
    aiRoadmapService = module.get(AiRoadmapService);
    dagreLayout = module.get(DagreLayoutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Deadline validation ──────────────────────────────────────────────────

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
      expect(aiRoadmapService.generateRoadmap).not.toHaveBeenCalled();
    });
  });

  // ── Timeline warning ─────────────────────────────────────────────────────

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

  // ── Gemini failure ───────────────────────────────────────────────────────

  describe('AI generation failure', () => {
    it('should propagate RoadmapGenerationUnavailableException from AiRoadmapService', async () => {
      aiRoadmapService.generateRoadmap.mockRejectedValue(
        new RoadmapGenerationUnavailableException(),
      );

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });
  });

  // ── Happy path ───────────────────────────────────────────────────────────

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

    it('should pass prerequisites to AiRoadmapService', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(aiRoadmapService.generateRoadmap).toHaveBeenCalledWith(
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
});
