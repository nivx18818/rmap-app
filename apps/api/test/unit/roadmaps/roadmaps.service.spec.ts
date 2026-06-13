/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
  QuizGenerationStatus,
  RoleCategory,
} from '@repo/db/prisma/client';

import {
  AppConflictException,
  DeadlineInPastException,
  InvalidStatusTransitionException,
  MilestoneSubmissionInProgressException,
  MilestoneSubmissionInvalidStateException,
  MilestoneSubmissionInvalidUrlException,
  MilestoneTestSuiteGenerationUnavailableException,
  NodeQuizGenerationUnavailableException,
  QuizNotPassedException,
  QuizSubmissionInvalidException,
  RoadmapNodeProgressInvalidUpdateException,
  RoadmapGenerationUnavailableException,
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
  UserNodeProgressNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MilestoneExecutionClient } from '@/modules/roadmaps/milestone-execution.client';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';
import { DagreLayoutService } from '@/modules/roadmaps/services/dagre-layout.service';
import { RoadmapGenerationService } from '@/modules/roadmaps/services/roadmap-generation.service';
import { RoadmapMilestoneService } from '@/modules/roadmaps/services/roadmap-milestone.service';
import { RoadmapProgressService } from '@/modules/roadmaps/services/roadmap-progress.service';
import { RoadmapQueryService } from '@/modules/roadmaps/services/roadmap-query.service';
import { RoadmapQuizService } from '@/modules/roadmaps/services/roadmap-quiz.service';
import { parseMilestoneTestResult as parseMilestoneTestResultOutput } from '@/modules/roadmaps/utils/milestone-output';

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
    $queryRaw: jest.fn().mockResolvedValue([]),
    dailyActivity: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    milestoneSubmission: {
      create: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      }),
      update: jest.fn(),
    },
    roadmap: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(MOCK_ROADMAP),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(MOCK_ROADMAP),
    },
    roadmapNode: {
      createMany: jest.fn().mockResolvedValue({ count: 19 }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userNodeProgress: {
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn().mockResolvedValue({ count: 19 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 4 }),
    },
  };
}

type TransactionMock = ReturnType<typeof makeTxMock>;
type TransactionCallback = (tx: TransactionMock) => unknown;
type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface RoadmapNodeQuizSelection {
  id: string;
  nodeType: NodeType;
  parentId?: string | null;
  posY?: number;
  skillId: string | null;
  userNodeProgress?: Array<{
    startedAt?: Date | null;
    status: NodeStatus;
  }>;
  skill?: {
    id: string;
    name: string;
    description: string | null;
    roleCategory: RoleCategory | null;
    quizGenerationStatus: QuizGenerationStatus;
  } | null;
}

interface QuizQuestionRecord {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

interface RoadmapNodeDetailSelection {
  id: string;
  roadmapId: string;
  parentId: string | null;
  skillId: string | null;
  name: string;
  description: string | null;
  nodeType: NodeType;
  estimatedHours: number | null;
  posX: number;
  posY: number;
  userNodeProgress: Array<{
    id: string;
    roadmapNodeId: string;
    status: NodeStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    quizScorePct: number | null;
    quizPassed: boolean | null;
  }>;
  roadmap: {
    roleCategory: RoleCategory | null;
  };
  skill: {
    id: string;
    name: string;
    description: string | null;
    defaultEstimatedHours: number | null;
    roleCategory: RoleCategory | null;
    resources: Array<{
      id: number;
      createdAt: Date;
      title: string;
      url: string;
      resourceType: string;
      isFree: boolean;
      isPrimary: boolean;
    }>;
    prerequisites: Array<{
      prerequisiteSkillId: string;
      prerequisiteSkill: { name: string };
    }>;
  } | null;
  milestoneSubmissions: MilestoneSubmissionSelection[];
  milestoneTestSuite: MilestoneTestSuiteSelection | null;
}

interface MilestoneSubmissionSelection {
  id: string;
  repoUrl: string;
  testSuiteId: string | null;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  passRatePct: number | null;
  passedTests: number | null;
  testResults: Array<{ message: string; name: string; passed: boolean }> | null;
  totalTests: number | null;
  attemptNumber: number;
  createdAt: Date;
  completedAt: Date | null;
}

interface MilestoneTestSuiteSelection {
  id: string;
  roadmapNodeId: string;
  status: MilestoneTestSuiteStatus;
  title: string | null;
  summary: string | null;
  testCases: Array<{ description: string; name: string }> | null;
  testFileContent: string | null;
  passThresholdPct: number;
  generationStartedAt: Date | null;
  generatedAt: Date | null;
}

type CompleteMilestoneSubmission = (
  submissionId: string,
  status: MilestoneSubmissionStatus,
  outputLog: string,
  testResult?: {
    passRatePct: number;
    passedTests: number;
    testResults: Array<{ message: string; name: string; passed: boolean }>;
    totalTests: number;
  },
) => Promise<void>;

type ParseMilestoneTestResult = (
  output: string,
) => ReturnType<typeof makeParsedMilestoneTestResult> | null;

type ExecuteMilestoneSubmission = (submissionId: string) => Promise<void>;

type RoadmapNodeFindFirstSelection = RoadmapNodeQuizSelection | RoadmapNodeDetailSelection;

interface RoadmapsPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  dailyActivity: {
    findMany: AsyncMock<Array<{ activityDate: Date; nodesCompleted: number }>>;
  };
  milestoneSubmission: {
    findFirst: AsyncMock<
      | MilestoneSubmissionSelection
      | { attemptNumber: number }
      | { status: MilestoneSubmissionStatus }
      | null
    >;
    findUnique: AsyncMock<{
      id: string;
      repoUrl: string;
      roadmapNodeId: string;
      testSuite: { id: string; passThresholdPct: number; testFileContent: string | null } | null;
      userId: string;
    } | null>;
    update: AsyncMock<MilestoneSubmissionSelection>;
  };
  milestoneTestSuite: {
    create: AsyncMock<{ id: string }>;
    findUnique: AsyncMock<
      MilestoneTestSuiteSelection | { id: string; status: MilestoneTestSuiteStatus } | null
    >;
    update: AsyncMock<MilestoneTestSuiteSelection>;
    updateMany: AsyncMock<{ count: number }>;
  };
  quizQuestion: {
    count: AsyncMock<number>;
    createMany: AsyncMock<{ count: number }>;
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<QuizQuestionRecord[]>;
  };
  roadmap: {
    count: AsyncMock<number>;
    deleteMany: AsyncMock<{ count: number }>;
    findFirst: AsyncMock<Record<string, unknown> | null>;
    findMany: AsyncMock<unknown[]>;
    update: AsyncMock<Record<string, unknown>>;
  };
  roadmapNode: {
    findFirst: AsyncMock<RoadmapNodeFindFirstSelection | null>;
    findMany: AsyncMock<unknown[]>;
  };
  skill: {
    findMany: AsyncMock<typeof MOCK_SKILLS>;
    update: AsyncMock<Record<string, unknown>>;
    updateMany: AsyncMock<{ count: number }>;
  };
  skillPrerequisite: {
    findMany: AsyncMock<typeof MOCK_PRISMA_SKILL_PREREQUISITES>;
  };
  userNodeProgress: {
    findMany: AsyncMock<Array<{ startedAt: Date | null; roadmapNode: { roadmapId: string } }>>;
    findUnique: AsyncMock<{ status: NodeStatus; quizPassed: boolean | null } | null>;
  };
}

const createDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
});

const makeMilestoneTestResults = (passedCount = 6) =>
  Array.from({ length: 6 }, (_value, index) => ({
    name: `Generated milestone test ${index + 1}`,
    passed: index < passedCount,
    message:
      index < passedCount ? `Requirement ${index + 1} passed.` : `Requirement ${index + 1} failed.`,
  }));

const makeMilestoneResultPayload = (passedCount = 6) => ({
  totalTests: 6,
  passedTests: passedCount,
  tests: makeMilestoneTestResults(passedCount),
});

const makeMilestoneResultMarkerFromPayload = (payload: unknown) =>
  `RMAP_MILESTONE_RESULTS:${JSON.stringify(payload)}`;

const makeMilestoneResultMarker = (passedCount = 6) =>
  makeMilestoneResultMarkerFromPayload(makeMilestoneResultPayload(passedCount));

const makeParsedMilestoneTestResult = (passedCount = 6) => ({
  passRatePct: Number(((passedCount / 6) * 100).toFixed(2)),
  passedTests: passedCount,
  testResults: makeMilestoneTestResults(passedCount),
  totalTests: 6,
});

const makeGeneratedQuizQuestions = () =>
  Array.from({ length: 8 }, (_, index) => ({
    questionText: `Generated question ${index + 1}?`,
    optionA: `Generated option A ${index + 1}`,
    optionB: `Generated option B ${index + 1}`,
    optionC: `Generated option C ${index + 1}`,
    optionD: `Generated option D ${index + 1}`,
    correctOption: 'A' as const,
  }));

const makeGeneratedMilestoneTestSuite = () => ({
  title: 'API Capstone Generated Suite',
  summary: 'Checks the submitted API project against the milestone brief.',
  testCases: Array.from({ length: 6 }, (_, index) => ({
    name: `Generated milestone test ${index + 1}`,
    description: `Verifies milestone requirement ${index + 1}.`,
  })),
  testFileContent: `console.log('${makeMilestoneResultMarker(6)}');`,
});

const makeMilestoneTestSuite = (
  overrides: Partial<MilestoneTestSuiteSelection> = {},
): MilestoneTestSuiteSelection => ({
  id: 'suite-1',
  roadmapNodeId: 'milestone-1',
  status: MilestoneTestSuiteStatus.READY,
  title: 'API Capstone Generated Suite',
  summary: 'Checks the submitted API project against the milestone brief.',
  testCases: Array.from({ length: 6 }, (_, index) => ({
    name: `Generated milestone test ${index + 1}`,
    description: `Verifies milestone requirement ${index + 1}.`,
  })),
  testFileContent: `console.log('${makeMilestoneResultMarker(6)}');`,
  passThresholdPct: 80,
  generationStartedAt: null,
  generatedAt: new Date('2026-01-04T00:00:00Z'),
  ...overrides,
});

const expectAnyDate = (): Date => expect.any(Date) as Date;

const expectObjectContaining = <T extends object>(value: T): T =>
  expect.objectContaining(value) as T;

const createPrismaMock = (txMock: TransactionMock): RoadmapsPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      const transactionItems = input as Promise<unknown>[];

      return Promise.all(transactionItems);
    }

    const transactionCallback = input as TransactionCallback;
    return transactionCallback(txMock);
  }),
  dailyActivity: {
    findMany: jest.fn<Promise<Array<{ activityDate: Date; nodesCompleted: number }>>, unknown[]>(),
  },
  milestoneSubmission: {
    findFirst: jest.fn<
      Promise<
        | MilestoneSubmissionSelection
        | { attemptNumber: number }
        | { status: MilestoneSubmissionStatus }
        | null
      >,
      unknown[]
    >(),
    findUnique: jest.fn<
      Promise<{
        id: string;
        repoUrl: string;
        roadmapNodeId: string;
        testSuite: { id: string; passThresholdPct: number; testFileContent: string | null } | null;
        userId: string;
      } | null>,
      unknown[]
    >(),
    update: jest.fn<Promise<MilestoneSubmissionSelection>, unknown[]>(),
  },
  milestoneTestSuite: {
    create: jest.fn<Promise<{ id: string }>, unknown[]>(),
    findUnique: jest.fn<
      Promise<
        MilestoneTestSuiteSelection | { id: string; status: MilestoneTestSuiteStatus } | null
      >,
      unknown[]
    >(),
    update: jest.fn<Promise<MilestoneTestSuiteSelection>, unknown[]>(),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
  },
  quizQuestion: {
    count: jest.fn<Promise<number>, unknown[]>(),
    createMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findMany: jest.fn<Promise<QuizQuestionRecord[]>, unknown[]>(),
  },
  roadmap: {
    count: jest.fn<Promise<number>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findFirst: jest.fn<Promise<Record<string, unknown> | null>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    update: jest.fn<Promise<Record<string, unknown>>, unknown[]>(),
  },
  roadmapNode: {
    findFirst: jest.fn<Promise<RoadmapNodeFindFirstSelection | null>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
  },
  skill: {
    findMany: jest.fn<Promise<typeof MOCK_SKILLS>, unknown[]>().mockResolvedValue(MOCK_SKILLS),
    update: jest.fn<Promise<Record<string, unknown>>, unknown[]>(),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
  },
  skillPrerequisite: {
    findMany: jest
      .fn<Promise<typeof MOCK_PRISMA_SKILL_PREREQUISITES>, unknown[]>()
      .mockResolvedValue(MOCK_PRISMA_SKILL_PREREQUISITES),
  },
  userNodeProgress: {
    findMany: jest
      .fn<
        Promise<Array<{ startedAt: Date | null; roadmapNode: { roadmapId: string } }>>,
        unknown[]
      >()
      .mockResolvedValue([]),
    findUnique: jest.fn<
      Promise<{ status: NodeStatus; quizPassed: boolean | null } | null>,
      unknown[]
    >(),
  },
});

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let prisma: RoadmapsPrismaMock;
  let txMock: TransactionMock;
  let aiService: jest.Mocked<AiService>;
  let dagreLayout: jest.Mocked<DagreLayoutService>;
  let milestoneExecutionClient: jest.Mocked<MilestoneExecutionClient>;
  let milestoneService: RoadmapMilestoneService;

  beforeEach(async () => {
    txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
        RoadmapGenerationService,
        RoadmapQueryService,
        RoadmapProgressService,
        RoadmapQuizService,
        RoadmapMilestoneService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AiService,
          useValue: {
            generateMilestoneTestSuite: jest.fn(),
            generateNodeQuiz: jest.fn(),
            generateRoadmap: jest.fn().mockResolvedValue(JSON.stringify(MOCK_AI_OUTPUT)),
          },
        },
        {
          provide: DagreLayoutService,
          useValue: { computeLayout: jest.fn().mockReturnValue(MOCK_LAYOUT_MAP) },
        },
        {
          provide: MilestoneExecutionClient,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
    prisma = prismaMock;
    aiService = module.get(AiService);
    dagreLayout = module.get(DagreLayoutService);
    milestoneExecutionClient = module.get(MilestoneExecutionClient);
    milestoneService = module.get(RoadmapMilestoneService);
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

    it('should use generated leaf hours, not the full role catalog, for feasibility', async () => {
      prisma.skill.findMany.mockResolvedValueOnce([
        ...MOCK_SKILLS,
        {
          id: 'skill-unused',
          name: 'Unused Advanced Topic',
          defaultEstimatedHours: 500,
        },
      ]);

      const result = await service.generate(MOCK_USER_ID, {
        ...MOCK_DTO,
        deadlineDate: new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10),
        hoursPerDay: 2,
      });

      expect(result.timelineWarning).toBeNull();
    });

    it('should return a timelineWarning when pace is >15% behind', async () => {
      // Generated leaf estimate is intentionally too large for this near deadline.
      const result = await service.generate(MOCK_USER_ID, {
        ...MOCK_DTO,
        deadlineDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10), // 2 days out
        hoursPerDay: 0.5,
      });
      expect(result.timelineWarning).not.toBeNull();
      expect(result.timelineWarning!.isBehind).toBe(true);
      expect(result.timelineWarning!.paceDeficitPct).toBeGreaterThan(0);
      expect(result.timelineWarning!.estimatedDelayDays).toBeGreaterThan(0);
      expect(result.timelineWarning!.message).toContain('generated roadmap estimate');
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

    it('should throw RoadmapGenerationUnavailableException when a group contains a nested group', async () => {
      const invalid = {
        title: 'T',
        description: 'D',
        nodes: [
          {
            name: 'Parent Group',
            nodeType: 'group',
            children: [
              {
                name: 'Nested Group',
                nodeType: 'group',
                children: [{ name: 'HTTP & REST', nodeType: 'required', skillId: 'skill-1' }],
              },
            ],
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

    it('should persist estimatedWeeks from generated leaf hours and daily study time', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(txMock.roadmap.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          estimatedWeeks: 6,
        }) as object,
      });
    });

    it('should keep all progress rows locked after generation', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      const createProgressMock = txMock.userNodeProgress.createMany as jest.Mock<
        Promise<{ count: number }>,
        [{ data: Array<{ status: NodeStatus; userId: string }> }]
      >;
      const createProgressCall = createProgressMock.mock.calls[0]?.[0];

      expect(createProgressCall?.data.length).toBeGreaterThan(0);
      expect(
        createProgressCall?.data.every(
          (progress) => progress.status === NodeStatus.LOCKED && progress.userId === MOCK_USER_ID,
        ),
      ).toBe(true);
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
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
          skill: null,
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
          skill: {
            _count: {
              resources: 7,
            },
          },
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
          where: {
            roadmapId,
            roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
          },
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
            resourcesCount: 0,
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
            resourcesCount: 5,
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

    it('should request only the current user progress when listing template nodes', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([
        {
          id: 'template-node-1',
          roadmapId,
          parentId: null,
          skillId: null,
          name: 'Template Foundations',
          description: null,
          nodeType: NodeType.GROUP,
          estimatedHours: null,
          posX: 120,
          posY: 200,
          skill: null,
          userNodeProgress: [
            {
              id: 'progress-current-user',
              roadmapNodeId: 'template-node-1',
              status: NodeStatus.IN_PROGRESS,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: null,
              quizScorePct: null,
              quizPassed: null,
            },
          ],
        },
      ]);

      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {});

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expectObjectContaining({
          select: expectObjectContaining({
            userNodeProgress: expectObjectContaining({
              where: { userId: MOCK_USER_ID },
            }),
          }),
          where: {
            roadmapId,
            roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
          },
        }),
      );
      expect(result.nodes).toEqual([
        expectObjectContaining({
          id: 'template-node-1',
          progress: expectObjectContaining({
            id: 'progress-current-user',
            roadmapNodeId: 'template-node-1',
            status: NodeStatus.IN_PROGRESS,
          }),
          resourcesCount: 0,
        }),
      ]);
    });

    it('should filter by status across node types when nodeType is omitted', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, roadmapId, { status: NodeStatus.COMPLETED });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roadmapId,
            userNodeProgress: {
              some: {
                status: NodeStatus.COMPLETED,
                userId: MOCK_USER_ID,
              },
            },
          }) as unknown,
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
          }) as unknown,
        }),
      );
    });

    it('should filter by status for non-leaf nodeType', async () => {
      prisma.roadmapNode.findMany.mockResolvedValueOnce([
        {
          id: 'group-1',
          roadmapId,
          parentId: null,
          skillId: null,
          name: 'Backend Foundations',
          description: null,
          nodeType: NodeType.GROUP,
          estimatedHours: null,
          posX: 120,
          posY: 200,
          userNodeProgress: [
            {
              id: 'progress-group-1',
              userId: MOCK_USER_ID,
              roadmapNodeId: 'group-1',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: null,
              quizPassed: null,
            },
          ],
        },
      ]);

      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {
        nodeType: NodeType.GROUP,
        status: NodeStatus.COMPLETED,
      });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectObjectContaining({
            roadmapId,
            nodeType: NodeType.GROUP,
            userNodeProgress: {
              some: {
                status: NodeStatus.COMPLETED,
                userId: MOCK_USER_ID,
              },
            },
          }),
        }),
      );

      expect(result).toEqual({
        nodes: [
          {
            id: 'group-1',
            roadmapId,
            parentId: null,
            skillId: null,
            name: 'Backend Foundations',
            description: null,
            nodeType: NodeType.GROUP,
            estimatedHours: null,
            posX: 120,
            posY: 200,
            resourcesCount: 0,
            progress: {
              id: 'progress-group-1',
              roadmapNodeId: 'group-1',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: null,
              quizPassed: null,
            },
          },
        ],
      });
    });
  });

  describe('getProgressSummary', () => {
    const roadmapId = 'roadmap-1';
    const systemNow = new Date('2026-05-21T12:00:00Z');
    const makeProgressNode = (
      id: string,
      nodeType: NodeType,
      status: NodeStatus | null,
      estimatedHours: number | null,
    ) => ({
      id,
      nodeType,
      estimatedHours,
      userNodeProgress: status ? [{ status }] : [],
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(systemNow);
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        generatedAt: new Date('2026-05-20T03:00:00Z'),
        hoursPerDay: createDecimal(2),
        id: roadmapId,
      });
      prisma.dailyActivity.findMany.mockResolvedValue([]);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throw RoadmapNotFoundException when the roadmap is not found', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getProgressSummary(MOCK_USER_ID, roadmapId)).rejects.toThrow(
        RoadmapNotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should compute completion and skill readiness percentages', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([
        makeProgressNode('group-1', NodeType.GROUP, NodeStatus.COMPLETED, null),
        makeProgressNode('required-1', NodeType.REQUIRED, NodeStatus.COMPLETED, 2),
        makeProgressNode('required-2', NodeType.REQUIRED, NodeStatus.IN_PROGRESS, 8),
        makeProgressNode('optional-1', NodeType.OPTIONAL, NodeStatus.COMPLETED, 3),
        makeProgressNode('milestone-1', NodeType.MILESTONE, NodeStatus.LOCKED, null),
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result).toEqual(
        expect.objectContaining({
          roadmapId,
          completionPct: 60,
          skillReadinessPct: 50,
          nodesTotal: 5,
          nodesCompleted: 3,
          timelineWarning: null,
        }),
      );
    });

    it('should compute streak from consecutive daily activity rows', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        generatedAt: new Date('2026-05-20T03:00:00Z'),
        hoursPerDay: null,
        id: roadmapId,
      });
      prisma.roadmapNode.findMany.mockResolvedValue([]);
      prisma.dailyActivity.findMany.mockResolvedValue([
        { activityDate: new Date('2026-05-20T00:00:00Z'), nodesCompleted: 1 },
        { activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 2 },
        { activityDate: new Date('2026-05-18T00:00:00Z'), nodesCompleted: 1 },
        { activityDate: new Date('2026-05-17T00:00:00Z'), nodesCompleted: 0 },
        { activityDate: new Date('2026-05-16T00:00:00Z'), nodesCompleted: 1 },
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result.streakDays).toBe(3);
      expect(result.completionPct).toBe(0);
      expect(result.skillReadinessPct).toBe(0);
    });

    it('should return a timeline warning when pace deficit is at least 15 percent', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        generatedAt: new Date('2026-05-18T03:00:00Z'),
        hoursPerDay: createDecimal(4),
        id: roadmapId,
      });
      prisma.roadmapNode.findMany.mockResolvedValue([
        makeProgressNode('required-1', NodeType.REQUIRED, NodeStatus.COMPLETED, 9),
        makeProgressNode('required-2', NodeType.REQUIRED, NodeStatus.IN_PROGRESS, 4),
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result.timelineWarning).toEqual({
        isBehind: true,
        paceDeficitPct: 25,
        estimatedDelayDays: 1,
        message: 'You are 25% behind pace - projected delay is about 1 day(s).',
      });
    });

    it('should return null timeline warning on the generated calendar day', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        generatedAt: new Date('2026-05-21T03:00:00Z'),
        hoursPerDay: createDecimal(4),
        id: roadmapId,
      });
      prisma.roadmapNode.findMany.mockResolvedValue([
        makeProgressNode('required-1', NodeType.REQUIRED, NodeStatus.IN_PROGRESS, 8),
        makeProgressNode('required-2', NodeType.REQUIRED, NodeStatus.LOCKED, 6),
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result.timelineWarning).toBeNull();
    });

    it('should return null timeline warning when on track', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        generatedAt: new Date('2026-05-19T03:00:00Z'),
        hoursPerDay: createDecimal(4),
        id: roadmapId,
      });
      prisma.roadmapNode.findMany.mockResolvedValue([
        makeProgressNode('required-1', NodeType.REQUIRED, NodeStatus.COMPLETED, 11),
        makeProgressNode('required-2', NodeType.REQUIRED, NodeStatus.IN_PROGRESS, 4),
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result.timelineWarning).toBeNull();
    });

    it('should return a timeline warning when remaining estimate does not fit the deadline', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: new Date('2026-05-23T00:00:00Z'),
        generatedAt: new Date('2026-05-21T03:00:00Z'),
        hoursPerDay: createDecimal(2),
        id: roadmapId,
      });
      prisma.roadmapNode.findMany.mockResolvedValue([
        makeProgressNode('required-1', NodeType.REQUIRED, NodeStatus.IN_PROGRESS, 40),
        makeProgressNode('optional-1', NodeType.OPTIONAL, NodeStatus.LOCKED, 20),
      ]);

      const result = await service.getProgressSummary(MOCK_USER_ID, roadmapId);

      expect(result.timelineWarning).toEqual({
        isBehind: true,
        paceDeficitPct: 93.3,
        estimatedDelayDays: 28,
        message:
          'The remaining roadmap estimate may not fit your deadline: about 28 additional study day(s) needed.',
      });
    });
  });

  describe('getNodeDetail', () => {
    const nodeId = 'node-1';
    const roadmapId = 'roadmap-1';
    const skillId = 'skill-1';
    const startedAt = new Date('2026-01-01T00:00:00Z');

    const makeNodeDetail = (
      overrides: Partial<RoadmapNodeDetailSelection> = {},
    ): RoadmapNodeDetailSelection => ({
      id: nodeId,
      roadmapId,
      parentId: 'group-1',
      skillId,
      name: 'REST API',
      description: 'Build production REST APIs',
      nodeType: NodeType.REQUIRED,
      estimatedHours: 6,
      posX: 140,
      posY: 240,
      milestoneSubmissions: [],
      milestoneTestSuite: null,
      roadmap: {
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
      userNodeProgress: [
        {
          id: 'progress-1',
          roadmapNodeId: nodeId,
          status: NodeStatus.IN_PROGRESS,
          startedAt,
          completedAt: null,
          quizScorePct: 80,
          quizPassed: true,
        },
      ],
      skill: {
        id: skillId,
        name: 'REST APIs',
        description: 'Design and build RESTful HTTP APIs.',
        defaultEstimatedHours: 8,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        resources: [
          {
            id: 1,
            createdAt: new Date('2026-01-03T00:00:00Z'),
            title: 'Primary late',
            url: 'https://example.com/primary-late',
            resourceType: 'DOCS',
            isFree: true,
            isPrimary: true,
          },
          {
            id: 2,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            title: 'Primary early',
            url: 'https://example.com/primary-early',
            resourceType: 'COURSE',
            isFree: false,
            isPrimary: true,
          },
          {
            id: 3,
            createdAt: new Date('2026-01-02T00:00:00Z'),
            title: 'Article',
            url: 'https://example.com/article',
            resourceType: 'ARTICLE',
            isFree: true,
            isPrimary: false,
          },
        ],
        prerequisites: [
          {
            prerequisiteSkillId: 'skill-prereq-1',
            prerequisiteSkill: { name: 'HTTP Basics' },
          },
        ],
      },
      ...overrides,
    });

    it('should return full detail for a leaf node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(makeNodeDetail());

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);
      const findFirstArgs = prisma.roadmapNode.findFirst.mock.calls[0]?.[0] as {
        where: unknown;
        select: {
          skill?: {
            select?: {
              resources?: {
                orderBy?: unknown;
              };
            };
          };
        };
      };

      expect(findFirstArgs.where).toEqual({
        id: nodeId,
        roadmapId,
        roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
      });
      expect(findFirstArgs.select.skill?.select?.resources?.orderBy).toEqual([
        { isPrimary: 'desc' },
        { isFree: 'desc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ]);
      expect(result).toEqual({
        node: {
          id: nodeId,
          roadmapId,
          parentId: 'group-1',
          skillId,
          name: 'REST API',
          description: 'Build production REST APIs',
          nodeType: NodeType.REQUIRED,
          estimatedHours: 6,
          posX: 140,
          posY: 240,
          resourcesCount: 3,
          progress: {
            id: 'progress-1',
            roadmapNodeId: nodeId,
            status: NodeStatus.IN_PROGRESS,
            startedAt,
            completedAt: null,
            quizScorePct: 80,
            quizPassed: true,
          },
        },
        skill: {
          id: skillId,
          name: 'REST APIs',
          description: 'Design and build RESTful HTTP APIs.',
          defaultEstimatedHours: 8,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
        },
        resources: [
          {
            id: 1,
            title: 'Primary late',
            url: 'https://example.com/primary-late',
            resourceType: 'DOCS',
            isFree: true,
            isPrimary: true,
          },
          {
            id: 2,
            title: 'Primary early',
            url: 'https://example.com/primary-early',
            resourceType: 'COURSE',
            isFree: false,
            isPrimary: true,
          },
          {
            id: 3,
            title: 'Article',
            url: 'https://example.com/article',
            resourceType: 'ARTICLE',
            isFree: true,
            isPrimary: false,
          },
        ],
        prerequisites: [{ skillId: 'skill-prereq-1', skillName: 'HTTP Basics' }],
        latestSubmission: null,
        milestoneTestSuite: null,
      });
    });

    it('should order resources by primary, free, and resource type priority', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skill: {
            id: skillId,
            name: 'REST APIs',
            description: null,
            defaultEstimatedHours: null,
            roleCategory: null,
            resources: [
              {
                id: 4,
                createdAt: new Date('2026-01-04T00:00:00Z'),
                title: 'Non-primary late',
                url: 'https://example.com/non-primary-late',
                resourceType: 'ARTICLE',
                isFree: true,
                isPrimary: false,
              },
              {
                id: 2,
                createdAt: new Date('2026-01-02T00:00:00Z'),
                title: 'Primary late',
                url: 'https://example.com/primary-late',
                resourceType: 'DOCS',
                isFree: true,
                isPrimary: true,
              },
              {
                id: 1,
                createdAt: new Date('2026-01-01T00:00:00Z'),
                title: 'Primary early',
                url: 'https://example.com/primary-early',
                resourceType: 'COURSE',
                isFree: false,
                isPrimary: true,
              },
              {
                id: 3,
                createdAt: new Date('2026-01-03T00:00:00Z'),
                title: 'Non-primary early',
                url: 'https://example.com/non-primary-early',
                resourceType: 'YOUTUBE',
                isFree: true,
                isPrimary: false,
              },
            ],
            prerequisites: [],
          },
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.resources?.map((resource) => resource.id)).toEqual([2, 1, 3, 4]);
    });

    it('should return at most five resources', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skill: {
            id: skillId,
            name: 'REST APIs',
            description: null,
            defaultEstimatedHours: null,
            roleCategory: null,
            resources: [
              {
                id: 1,
                createdAt: new Date('2026-01-01T00:00:00Z'),
                title: 'Primary one',
                url: 'https://example.com/primary-one',
                resourceType: 'DOCS',
                isFree: true,
                isPrimary: true,
              },
              {
                id: 2,
                createdAt: new Date('2026-01-02T00:00:00Z'),
                title: 'Primary two',
                url: 'https://example.com/primary-two',
                resourceType: 'COURSE',
                isFree: true,
                isPrimary: true,
              },
              {
                id: 3,
                createdAt: new Date('2026-01-03T00:00:00Z'),
                title: 'Primary three',
                url: 'https://example.com/primary-three',
                resourceType: 'YOUTUBE',
                isFree: true,
                isPrimary: true,
              },
              {
                id: 4,
                createdAt: new Date('2026-01-04T00:00:00Z'),
                title: 'Article',
                url: 'https://example.com/article',
                resourceType: 'ARTICLE',
                isFree: true,
                isPrimary: false,
              },
              {
                id: 5,
                createdAt: new Date('2026-01-05T00:00:00Z'),
                title: 'Primary article',
                url: 'https://example.com/primary-article',
                resourceType: 'ARTICLE',
                isFree: true,
                isPrimary: true,
              },
              {
                id: 6,
                createdAt: new Date('2026-01-06T00:00:00Z'),
                title: 'Secondary video',
                url: 'https://example.com/secondary-video',
                resourceType: 'YOUTUBE',
                isFree: true,
                isPrimary: false,
              },
            ],
            prerequisites: [],
          },
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.resources?.map((resource) => resource.id)).toEqual([3, 1, 2, 5, 6]);
      expect(result.resources?.filter((resource) => resource.isPrimary)).toHaveLength(4);
      expect(result.resources).toHaveLength(5);
    });

    it('should return null skill and resources for a group node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          parentId: null,
          skillId: null,
          nodeType: NodeType.GROUP,
          estimatedHours: null,
          skill: null,
          userNodeProgress: [],
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.skill).toBeNull();
      expect(result.resources).toBeNull();
      expect(result.prerequisites).toEqual([]);
      expect(result.node.progress).toBeNull();
      expect(result.latestSubmission).toBeNull();
      expect(result.milestoneTestSuite).toBeNull();
    });

    it('should return null skill and resources for a milestone node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          userNodeProgress: [
            {
              id: 'progress-1',
              roadmapNodeId: nodeId,
              status: NodeStatus.LOCKED,
              startedAt,
              completedAt: null,
              quizScorePct: null,
              quizPassed: null,
            },
          ],
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.skill).toBeNull();
      expect(result.resources).toBeNull();
      expect(result.prerequisites).toEqual([]);
      expect(result.latestSubmission).toBeNull();
      expect(result.milestoneTestSuite).toBeNull();
    });

    it('should generate a missing unlocked milestone test suite and return it', async () => {
      const generatedSuite = makeGeneratedMilestoneTestSuite();
      const storedSuite = makeMilestoneTestSuite({ roadmapNodeId: nodeId });

      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          milestoneTestSuite: null,
        }),
      );
      prisma.milestoneTestSuite.findUnique.mockResolvedValue(null);
      prisma.milestoneTestSuite.create.mockResolvedValue({ id: 'suite-1' });
      prisma.milestoneTestSuite.update.mockResolvedValue(storedSuite);
      aiService.generateMilestoneTestSuite.mockResolvedValue(generatedSuite);

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(aiService.generateMilestoneTestSuite).toHaveBeenCalledWith({
        name: 'REST API',
        projectBrief: 'Build production REST APIs',
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });
      expect(prisma.milestoneTestSuite.create).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            roadmapNodeId: nodeId,
            status: MilestoneTestSuiteStatus.GENERATING,
          }),
        }),
      );
      expect(prisma.milestoneTestSuite.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            status: MilestoneTestSuiteStatus.READY,
            testCases: generatedSuite.testCases,
          }),
        }),
      );
      expect(result.milestoneTestSuite?.id).toBe('suite-1');
      expect(result.milestoneTestSuite?.testCases[0]?.name).toBe('Generated milestone test 1');
    });

    it('should wait for in-progress milestone test suite generation', async () => {
      const readySuite = makeMilestoneTestSuite({ roadmapNodeId: nodeId });

      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          milestoneTestSuite: makeMilestoneTestSuite({
            roadmapNodeId: nodeId,
            status: MilestoneTestSuiteStatus.GENERATING,
            title: null,
            summary: null,
            testCases: null,
            testFileContent: null,
          }),
        }),
      );
      prisma.milestoneTestSuite.findUnique
        .mockResolvedValueOnce(
          makeMilestoneTestSuite({
            roadmapNodeId: nodeId,
            status: MilestoneTestSuiteStatus.GENERATING,
            title: null,
            summary: null,
            testCases: null,
            testFileContent: null,
          }),
        )
        .mockResolvedValueOnce(readySuite);

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(aiService.generateMilestoneTestSuite).not.toHaveBeenCalled();
      expect(prisma.milestoneTestSuite.create).not.toHaveBeenCalled();
      expect(result.milestoneTestSuite?.id).toBe('suite-1');
    });

    it('should mark failed milestone test suite generation and throw unavailable', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          milestoneTestSuite: null,
        }),
      );
      prisma.milestoneTestSuite.findUnique.mockResolvedValue(null);
      prisma.milestoneTestSuite.create.mockResolvedValue({ id: 'suite-1' });
      prisma.milestoneTestSuite.update.mockResolvedValue(
        makeMilestoneTestSuite({ roadmapNodeId: nodeId, status: MilestoneTestSuiteStatus.FAILED }),
      );
      aiService.generateMilestoneTestSuite.mockRejectedValue(
        new MilestoneTestSuiteGenerationUnavailableException(),
      );

      await expect(service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId)).rejects.toThrow(
        MilestoneTestSuiteGenerationUnavailableException,
      );
      expect(prisma.milestoneTestSuite.update).toHaveBeenCalledWith({
        where: { roadmapNodeId: nodeId },
        data: {
          generationStartedAt: null,
          status: MilestoneTestSuiteStatus.FAILED,
        },
      });
    });

    it('should include the latest submission for a milestone node', async () => {
      const createdAt = new Date('2026-01-04T00:00:00Z');
      const completedAt = new Date('2026-01-04T00:02:00Z');

      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          milestoneTestSuite: makeMilestoneTestSuite({ roadmapNodeId: nodeId }),
          milestoneSubmissions: [
            {
              id: 'submission-1',
              repoUrl: 'https://github.com/acme/api-project',
              testSuiteId: 'suite-1',
              status: MilestoneSubmissionStatus.PASSED,
              outputLog: 'ok',
              passRatePct: 100,
              passedTests: 6,
              testResults: makeMilestoneTestResults(6),
              totalTests: 6,
              attemptNumber: 2,
              createdAt,
              completedAt,
            },
          ],
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.latestSubmission).toEqual({
        id: 'submission-1',
        repoUrl: 'https://github.com/acme/api-project',
        testSuiteId: 'suite-1',
        status: MilestoneSubmissionStatus.PASSED,
        outputLog: 'ok',
        passRatePct: 100,
        passedTests: 6,
        testResults: makeMilestoneTestResults(6),
        totalTests: 6,
        attemptNumber: 2,
        createdAt: createdAt.toISOString(),
        completedAt: completedAt.toISOString(),
      });
      expect(result.milestoneTestSuite?.id).toBe('suite-1');
      expect(result.milestoneTestSuite?.passThresholdPct).toBe(80);
      expect(result.milestoneTestSuite?.testCases).toHaveLength(6);
    });

    it('should ignore milestone submissions from an earlier learning cycle', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(
        makeNodeDetail({
          skillId: null,
          nodeType: NodeType.MILESTONE,
          estimatedHours: null,
          skill: null,
          milestoneTestSuite: makeMilestoneTestSuite({ roadmapNodeId: nodeId }),
          milestoneSubmissions: [
            {
              id: 'old-submission',
              repoUrl: 'https://github.com/acme/old-project',
              testSuiteId: 'suite-1',
              status: MilestoneSubmissionStatus.PASSED,
              outputLog: 'ok',
              passRatePct: 100,
              passedTests: 6,
              testResults: makeMilestoneTestResults(6),
              totalTests: 6,
              attemptNumber: 1,
              createdAt: new Date('2025-12-31T23:59:59Z'),
              completedAt: new Date('2025-12-31T23:59:59Z'),
            },
          ],
        }),
      );

      const result = await service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.latestSubmission).toBeNull();
    });

    it('should throw RoadmapNodeNotFoundException when the node is not found', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId)).rejects.toThrow(
        RoadmapNodeNotFoundException,
      );
    });

    it('should throw RoadmapNodeNotFoundException when the node belongs to another user', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(service.getNodeDetail(MOCK_USER_ID, roadmapId, nodeId)).rejects.toThrow(
        RoadmapNodeNotFoundException,
      );
      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: nodeId,
            roadmapId,
            roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
          },
        }),
      );
    });
  });

  describe('listUserRoadmaps', () => {
    it('should return paginated current user roadmaps with mapped response fields', async () => {
      const roadmap = {
        deadlineDate: new Date('2025-10-01T00:00:00.000Z'),
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: new Date('2025-04-24T07:00:00.000Z'),
        goalName: 'Backend Intern at a product company',
        hoursPerDay: createDecimal(2.5),
        id: 'roadmap-1',
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Your Backend Intern Roadmap',
        updatedAt: new Date('2025-04-25T08:00:00.000Z'),
        userId: 'user-1',
      };

      prisma.roadmap.findMany.mockResolvedValue([roadmap]);
      prisma.roadmap.count.mockResolvedValue(42);
      prisma.userNodeProgress.findMany.mockResolvedValueOnce([
        {
          startedAt: new Date('2025-04-24T07:30:00.000Z'),
          roadmapNode: { roadmapId: 'roadmap-1' },
        },
      ]);

      const result = await service.listUserRoadmaps('user-1', { page: 2, perPage: 10 });

      expect(prisma.roadmap.findMany.mock.calls[0]?.[0]).toEqual({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          deadlineDate: true,
          description: true,
          estimatedWeeks: true,
          generatedAt: true,
          goalName: true,
          hoursPerDay: true,
          id: true,
          isTemplate: true,
          roleCategory: true,
          title: true,
          updatedAt: true,
          userId: true,
        },
        skip: 10,
        take: 10,
        where: {
          isTemplate: false,
          userId: 'user-1',
        },
      });
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: false,
          userId: 'user-1',
        },
      });
      expect(result).toEqual({
        data: [
          {
            deadlineDate: '2025-10-01',
            description: 'A backend plan',
            estimatedWeeks: null,
            generatedAt: '2025-04-24T07:00:00.000Z',
            goalName: 'Backend Intern at a product company',
            hoursPerDay: 2.5,
            id: 'roadmap-1',
            isTemplate: false,
            roleCategory: RoleCategory.WEB_DEVELOPMENT,
            startedAt: '2025-04-24T07:30:00.000Z',
            title: 'Your Backend Intern Roadmap',
            updatedAt: '2025-04-25T08:00:00.000Z',
            userId: 'user-1',
          },
        ],
        meta: {
          page: 2,
          perPage: 10,
          total: 42,
          totalPages: 5,
        },
      });
    });

    it('should use default pagination values', async () => {
      prisma.roadmap.findMany.mockResolvedValue([]);
      prisma.roadmap.count.mockResolvedValue(0);

      const result = await service.listUserRoadmaps('user-1', {});

      expect(prisma.roadmap.findMany.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return an empty data array when no roadmaps exist for the requested page', async () => {
      prisma.roadmap.findMany.mockResolvedValue([]);
      prisma.roadmap.count.mockResolvedValue(21);

      const result = await service.listUserRoadmaps('user-1', { page: 4, perPage: 10 });

      expect(result).toEqual({
        data: [],
        meta: {
          page: 4,
          perPage: 10,
          total: 21,
          totalPages: 3,
        },
      });
    });
  });

  describe('getByIdForOwner', () => {
    it('should return a formatted roadmap when owned by the user', async () => {
      const roadmapId = 'roadmap-1';
      const userId = 'user-1';
      const roadmap = {
        deadlineDate: new Date('2025-10-01T00:00:00.000Z'),
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: new Date('2025-04-24T07:00:00.000Z'),
        goalName: 'Backend Intern at a product company',
        hoursPerDay: createDecimal(2.5),
        id: roadmapId,
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        startedAt: null,
        title: 'Backend roadmap',
        updatedAt: new Date('2025-04-25T08:00:00.000Z'),
        userId,
      };

      prisma.roadmap.findFirst.mockResolvedValue(roadmap);

      await expect(service.getByIdForOwner(userId, roadmapId)).resolves.toEqual({
        deadlineDate: '2025-10-01',
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: '2025-04-24T07:00:00.000Z',
        goalName: 'Backend Intern at a product company',
        hoursPerDay: 2.5,
        id: roadmapId,
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        startedAt: null,
        title: 'Backend roadmap',
        updatedAt: '2025-04-25T08:00:00.000Z',
        userId,
      });

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: {
          deadlineDate: true,
          description: true,
          estimatedWeeks: true,
          generatedAt: true,
          goalName: true,
          hoursPerDay: true,
          id: true,
          isTemplate: true,
          roleCategory: true,
          title: true,
          updatedAt: true,
          userId: true,
        },
        where: {
          id: roadmapId,
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
        },
      });
    });

    it('should throw 404 when roadmap does not belong to user', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should throw 404 when roadmap is not found', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should return a template roadmap with the current user startedAt', async () => {
      const roadmapId = 'template-1';
      const userId = 'user-1';
      const startedAt = new Date('2025-04-24T07:30:00.000Z');

      prisma.roadmap.findFirst.mockResolvedValue({
        deadlineDate: null,
        description: 'A backend template',
        estimatedWeeks: 6,
        generatedAt: new Date('2025-04-24T07:00:00.000Z'),
        goalName: null,
        hoursPerDay: null,
        id: roadmapId,
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Backend template',
        updatedAt: new Date('2025-04-25T08:00:00.000Z'),
        userId: null,
      });
      prisma.userNodeProgress.findMany.mockResolvedValue([
        {
          startedAt,
          roadmapNode: { roadmapId },
        },
      ]);

      await expect(service.getByIdForOwner(userId, roadmapId)).resolves.toEqual({
        deadlineDate: null,
        description: 'A backend template',
        estimatedWeeks: 6,
        generatedAt: '2025-04-24T07:00:00.000Z',
        goalName: null,
        hoursPerDay: null,
        id: roadmapId,
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        startedAt: startedAt.toISOString(),
        title: 'Backend template',
        updatedAt: '2025-04-25T08:00:00.000Z',
        userId: null,
      });

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: expectObjectContaining({ id: true, isTemplate: true }),
        where: {
          id: roadmapId,
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
        },
      });
      expect(prisma.userNodeProgress.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startedAt: { not: null },
          roadmapNode: { roadmapId: { in: [roadmapId] } },
        },
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        select: {
          startedAt: true,
          roadmapNode: { select: { roadmapId: true } },
        },
      });
    });
  });

  describe('startLearning', () => {
    const roadmapId = 'roadmap-1';
    const userId = 'user-1';
    const generatedAt = new Date('2025-04-24T07:00:00.000Z');
    const updatedAt = new Date('2025-04-25T08:00:00.000Z');

    const makeRoadmap = (isTemplate = false) => ({
      deadlineDate: new Date('2025-10-01T00:00:00.000Z'),
      description: 'A backend plan',
      estimatedWeeks: null,
      generatedAt,
      goalName: 'Backend Intern at a product company',
      hoursPerDay: createDecimal(2.5),
      id: roadmapId,
      isTemplate,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Backend roadmap',
      updatedAt,
      userId: isTemplate ? null : userId,
    });

    it('should mark an unstarted roadmap as started and unlock the first group leaves', async () => {
      txMock.roadmap.findFirst.mockResolvedValue(makeRoadmap());
      txMock.roadmapNode.findFirst.mockResolvedValueOnce({ id: 'group-1' });
      txMock.userNodeProgress.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 });
      txMock.userNodeProgress.findMany.mockResolvedValueOnce([
        { roadmapNodeId: 'leaf-1' },
        { roadmapNodeId: 'leaf-2' },
      ]);

      const result = await service.startLearning(userId, roadmapId);

      const findRoadmapMock = txMock.roadmap.findFirst as jest.Mock<
        Promise<Record<string, unknown> | null>,
        [
          {
            select: { id?: boolean; isTemplate?: boolean };
            where: {
              id: string;
              OR: Array<{ isTemplate: boolean; userId?: string }>;
            };
          },
        ]
      >;
      const findRoadmapCall = findRoadmapMock.mock.calls[0]?.[0];

      expect(findRoadmapCall).toEqual({
        select: expectObjectContaining({ id: true, isTemplate: true }),
        where: {
          id: roadmapId,
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
        },
      });
      expect(txMock.roadmap.update).not.toHaveBeenCalled();
      expect(txMock.roadmapNode.findFirst).toHaveBeenCalledWith({
        where: { roadmapId, nodeType: NodeType.GROUP },
        orderBy: [{ posY: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(1, {
        where: { userId, roadmapNodeId: 'group-1', status: NodeStatus.LOCKED },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(2, {
        where: { userId, roadmapNodeId: { in: ['leaf-1', 'leaf-2'] } },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
      expect(result.roadmap.id).toBe(roadmapId);
      expect(result.roadmap.startedAt).toEqual(expect.any(String));
      expect(result.unlockedNodes).toEqual(['group-1', 'leaf-1', 'leaf-2']);
      expect(txMock.$queryRaw).toHaveBeenCalled();
    });

    it('should be idempotent when the roadmap is already started', async () => {
      const startedAt = new Date('2025-04-24T07:30:00.000Z');
      txMock.roadmap.findFirst.mockResolvedValue(makeRoadmap());
      txMock.userNodeProgress.findFirst.mockResolvedValue({ startedAt });

      const result = await service.startLearning(userId, roadmapId);

      expect(txMock.roadmap.update).not.toHaveBeenCalled();
      expect(txMock.roadmap.count).not.toHaveBeenCalled();
      expect(txMock.$queryRaw).toHaveBeenCalled();
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
      expect(result.roadmap.id).toBe(roadmapId);
      expect(result.roadmap.startedAt).toBe(startedAt.toISOString());
      expect(result.unlockedNodes).toEqual([]);
    });

    it('should create user progress rows before starting a template roadmap', async () => {
      txMock.roadmap.findFirst.mockResolvedValue(makeRoadmap(true));
      txMock.roadmapNode.findMany.mockResolvedValueOnce([{ id: 'group-1' }, { id: 'leaf-1' }]);
      txMock.roadmapNode.findFirst.mockResolvedValueOnce({ id: 'group-1' });
      txMock.userNodeProgress.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });
      txMock.userNodeProgress.findMany.mockResolvedValueOnce([{ roadmapNodeId: 'leaf-1' }]);

      const result = await service.startLearning(userId, roadmapId);

      expect(txMock.userNodeProgress.createMany).toHaveBeenCalledWith({
        data: [
          { userId, roadmapNodeId: 'group-1', status: NodeStatus.LOCKED },
          { userId, roadmapNodeId: 'leaf-1', status: NodeStatus.LOCKED },
        ],
        skipDuplicates: true,
      });
      expect(result.roadmap.isTemplate).toBe(true);
      expect(result.unlockedNodes).toEqual(['group-1', 'leaf-1']);
    });

    it('should throw 404 when roadmap is not owned by the user', async () => {
      txMock.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.startLearning(userId, roadmapId)).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });
  });

  describe('deleteByIdForOwner', () => {
    it('should permanently delete an owned roadmap', async () => {
      const roadmapId = 'roadmap-1';
      const userId = 'user-1';

      prisma.roadmap.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteByIdForOwner(userId, roadmapId);

      expect(prisma.roadmap.deleteMany).toHaveBeenCalledWith({
        where: {
          id: roadmapId,
          isTemplate: false,
          userId,
        },
      });
    });

    it('should throw 404 when roadmap belongs to another user', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );

      expect(prisma.roadmap.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'roadmap-1',
          isTemplate: false,
          userId: 'user-1',
        },
      });
    });

    it('should throw 404 when roadmap is not found', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should throw 404 when roadmap is a template', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });
  });

  describe('deleteRoadmapProgress', () => {
    const roadmapId = 'template-1';
    const userId = 'user-1';

    it('should delete only the current user progress for a template roadmap', async () => {
      txMock.roadmap.findFirst.mockResolvedValue({ id: roadmapId, isTemplate: true });
      txMock.userNodeProgress.deleteMany.mockResolvedValue({ count: 3 });

      await service.deleteRoadmapProgress(userId, roadmapId);

      expect(txMock.roadmap.findFirst).toHaveBeenCalledWith({
        where: {
          id: roadmapId,
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
        },
        select: { id: true },
      });
      expect(txMock.milestoneSubmission.findFirst).toHaveBeenCalledWith({
        where: {
          roadmapNode: { roadmapId },
          status: MilestoneSubmissionStatus.RUNNING,
          userId,
        },
        select: { id: true },
      });
      expect(txMock.userNodeProgress.deleteMany).toHaveBeenCalledWith({
        where: {
          roadmapNode: { roadmapId },
          userId,
        },
      });
      expect(txMock.roadmap.update).not.toHaveBeenCalled();
      expect(txMock.$queryRaw).toHaveBeenCalled();
    });

    it('should delete only the current user progress for an owned AI roadmap', async () => {
      const aiRoadmapId = 'ai-roadmap-1';
      txMock.roadmap.findFirst.mockResolvedValue({ id: aiRoadmapId, isTemplate: false });
      txMock.userNodeProgress.deleteMany.mockResolvedValue({ count: 2 });

      await service.deleteRoadmapProgress(userId, aiRoadmapId);

      expect(txMock.roadmap.findFirst).toHaveBeenCalledWith({
        where: {
          id: aiRoadmapId,
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
        },
        select: { id: true },
      });
      expect(txMock.userNodeProgress.deleteMany).toHaveBeenCalledWith({
        where: {
          roadmapNode: { roadmapId: aiRoadmapId },
          userId,
        },
      });
    });

    it('should be idempotent when the current user has no roadmap progress', async () => {
      txMock.roadmap.findFirst.mockResolvedValue({ id: roadmapId });
      txMock.userNodeProgress.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteRoadmapProgress(userId, roadmapId)).resolves.toBeUndefined();
    });

    it('should throw 404 when the roadmap is missing or inaccessible', async () => {
      txMock.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.deleteRoadmapProgress(userId, roadmapId)).rejects.toThrow(
        RoadmapNotFoundException,
      );
      expect(txMock.milestoneSubmission.findFirst).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.deleteMany).not.toHaveBeenCalled();
    });

    it('should reject deletion while a milestone submission is running', async () => {
      txMock.roadmap.findFirst.mockResolvedValue({ id: roadmapId });
      txMock.milestoneSubmission.findFirst.mockResolvedValue({ id: 'submission-1' });

      await expect(service.deleteRoadmapProgress(userId, roadmapId)).rejects.toThrow(
        AppConflictException,
      );
      expect(txMock.userNodeProgress.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getNodeQuiz', () => {
    const nodeId = 'node-1';
    const roadmapId = 'roadmap-1';
    const skillId = 'skill-1';
    const mockSkill = {
      id: skillId,
      name: 'HTTP & REST',
      description: 'Design HTTP APIs',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      quizGenerationStatus: QuizGenerationStatus.READY,
    };
    const mockQuestions = Array.from({ length: 8 }, (_, index) => ({
      id: `question-${index + 1}`,
      questionText: 'Which HTTP method is idempotent but not safe?',
      optionA: 'GET',
      optionB: 'POST',
      optionC: 'PUT',
      optionD: 'PATCH',
      correctOption: 'C',
    }));

    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.999);
    });

    it('should return exactly 5 public quiz questions for a leaf node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        skill: mockSkill,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.count.mockResolvedValue(mockQuestions.length);
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId);

      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
        where: {
          id: nodeId,
          roadmapId,
          roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
        },
        select: {
          id: true,
          nodeType: true,
          skillId: true,
          skill: {
            select: {
              id: true,
              name: true,
              description: true,
              roleCategory: true,
              quizGenerationStatus: true,
            },
          },
          userNodeProgress: {
            where: { userId: MOCK_USER_ID },
            select: { status: true },
            take: 1,
          },
        },
      });
      expect(prisma.quizQuestion.findMany).toHaveBeenCalledWith({
        where: { skillId },
        select: {
          id: true,
          questionText: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      expect(JSON.stringify(result)).not.toContain('correctOption');
      expect(aiService.generateNodeQuiz).not.toHaveBeenCalled();
      expect(prisma.skill.updateMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        nodeId,
        skillId,
        questions: mockQuestions.slice(0, 5).map((question) => ({
          id: question.id,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
        })),
      });
    });

    it('should allow optional leaf nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.OPTIONAL,
        skillId,
        skill: mockSkill,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.count.mockResolvedValue(mockQuestions.length);
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.questions).toHaveLength(5);
      expect(result.questions[0]?.id).toBe('question-1');
    });

    it('should generate and store 8 questions when fewer than 5 exist', async () => {
      const generatedQuestions = makeGeneratedQuizQuestions();
      const storedGeneratedQuestions = generatedQuestions.map((question, index) => ({
        id: `generated-question-${index + 1}`,
        ...question,
      }));

      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        skill: {
          ...mockSkill,
          quizGenerationStatus: QuizGenerationStatus.NOT_GENERATED,
        },
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.count.mockResolvedValueOnce(0).mockResolvedValueOnce(8);
      prisma.quizQuestion.findMany.mockResolvedValue(storedGeneratedQuestions);
      prisma.quizQuestion.deleteMany.mockResolvedValue({ count: 0 });
      prisma.quizQuestion.createMany.mockResolvedValue({ count: 8 });
      prisma.skill.update.mockResolvedValue({});
      prisma.skill.updateMany.mockResolvedValue({ count: 1 });
      aiService.generateNodeQuiz.mockResolvedValue(generatedQuestions);

      const result = await service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId);

      expect(prisma.skill.updateMany).toHaveBeenCalledWith({
        where: {
          id: skillId,
          quizGenerationStatus: { not: QuizGenerationStatus.GENERATING },
        },
        data: {
          quizGeneratedAt: null,
          quizGenerationStartedAt: expectAnyDate(),
          quizGenerationStatus: QuizGenerationStatus.GENERATING,
        },
      });
      expect(aiService.generateNodeQuiz).toHaveBeenCalledWith({
        description: mockSkill.description,
        name: mockSkill.name,
        roleCategory: mockSkill.roleCategory,
      });
      expect(prisma.quizQuestion.deleteMany).toHaveBeenCalledWith({ where: { skillId } });
      const createManyCall = prisma.quizQuestion.createMany.mock.calls[0]?.[0] as
        | { data: unknown[] }
        | undefined;
      expect(createManyCall?.data).toHaveLength(8);
      expect(prisma.skill.update).toHaveBeenCalledWith({
        where: { id: skillId },
        data: {
          quizGeneratedAt: expectAnyDate(),
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.READY,
        },
      });
      expect(result.questions).toHaveLength(5);
    });

    it('should wait for existing generation instead of calling AI twice', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        skill: {
          ...mockSkill,
          quizGenerationStatus: QuizGenerationStatus.GENERATING,
        },
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(mockQuestions.length);
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId);

      expect(result.questions).toHaveLength(5);
      expect(aiService.generateNodeQuiz).not.toHaveBeenCalled();
      expect(prisma.skill.updateMany).not.toHaveBeenCalled();
    });

    it('should mark skill generation failed when AI generation fails', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        skill: {
          ...mockSkill,
          quizGenerationStatus: QuizGenerationStatus.NOT_GENERATED,
        },
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.count.mockResolvedValue(0);
      prisma.skill.update.mockResolvedValue({});
      prisma.skill.updateMany.mockResolvedValue({ count: 1 });
      aiService.generateNodeQuiz.mockRejectedValue(new NodeQuizGenerationUnavailableException());

      await expect(service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId)).rejects.toThrow(
        NodeQuizGenerationUnavailableException,
      );
      expect(prisma.skill.update).toHaveBeenCalledWith({
        where: { id: skillId },
        data: {
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.FAILED,
        },
      });
    });

    it('should throw 404 when node is not found in the roadmap', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId)).rejects.toThrow(
        RoadmapNodeNotFoundException,
      );
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });

    it('should throw 422 for group nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.GROUP,
        skillId: null,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });

      await expect(service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId)).rejects.toMatchObject({
        status: 422,
      });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });

    it('should throw 422 for milestone nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });

      await expect(service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId)).rejects.toMatchObject({
        status: 422,
      });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });

    it('should throw 422 for locked leaf nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        userNodeProgress: [{ status: NodeStatus.LOCKED }],
      });

      await expect(service.getNodeQuiz(MOCK_USER_ID, roadmapId, nodeId)).rejects.toMatchObject({
        status: 422,
      });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('submitNodeQuiz', () => {
    const nodeId = 'node-1';
    const roadmapId = 'roadmap-1';
    const skillId = 'skill-1';
    const mockQuestions = [
      { id: 'question-1', correctOption: 'A' },
      { id: 'question-2', correctOption: 'B' },
      { id: 'question-3', correctOption: 'C' },
      { id: 'question-4', correctOption: 'D' },
      { id: 'question-5', correctOption: 'A' },
    ].map((question) => ({
      ...question,
      questionText: 'Question text',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
    }));
    const submitDto = {
      answers: [
        { questionId: 'question-1', selectedOption: 'a' },
        { questionId: 'question-2', selectedOption: 'B' },
        { questionId: 'question-3', selectedOption: 'C' },
        { questionId: 'question-4', selectedOption: 'D' },
        { questionId: 'question-5', selectedOption: 'B' },
      ],
    };
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const completedAt = new Date('2026-01-02T00:00:00Z');
    const updatedProgress = {
      id: 'progress-1',
      roadmapNodeId: nodeId,
      status: NodeStatus.COMPLETED,
      startedAt,
      completedAt,
      quizScorePct: createDecimal(80),
      quizPassed: true,
    };

    beforeEach(() => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions);
      txMock.userNodeProgress.update.mockResolvedValue(updatedProgress);
      txMock.roadmapNode.findFirst.mockResolvedValue({
        nodeType: NodeType.REQUIRED,
        parentId: 'group-1',
        posY: 100,
      });
      txMock.roadmapNode.findMany.mockResolvedValue([{ id: nodeId }, { id: 'other-leaf' }]);
      txMock.userNodeProgress.count.mockResolvedValue(1);
    });

    it('should score answers, reveal correct options, and return updated node progress', async () => {
      const result = await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto);

      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
        where: {
          id: nodeId,
          roadmapId,
          roadmap: { OR: [{ isTemplate: true }, { isTemplate: false, userId: MOCK_USER_ID }] },
        },
        select: {
          id: true,
          nodeType: true,
          skillId: true,
          userNodeProgress: {
            where: { userId: MOCK_USER_ID },
            select: { status: true },
            take: 1,
          },
        },
      });
      expect(prisma.quizQuestion.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['question-1', 'question-2', 'question-3', 'question-4', 'question-5'],
          },
          skillId,
        },
        select: {
          id: true,
          correctOption: true,
        },
      });
      expect(txMock.userNodeProgress.update).toHaveBeenCalledWith({
        where: {
          userId_roadmapNodeId: {
            userId: MOCK_USER_ID,
            roadmapNodeId: nodeId,
          },
        },
        data: {
          status: NodeStatus.COMPLETED,
          completedAt: expectAnyDate(),
          quizScorePct: 80,
          quizPassed: true,
        },
        select: {
          id: true,
          roadmapNodeId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          quizScorePct: true,
          quizPassed: true,
        },
      });
      expect(result).toEqual({
        scorePct: 80,
        passed: true,
        correctCount: 4,
        totalQuestions: 5,
        results: [
          { questionId: 'question-1', selectedOption: 'a', correctOption: 'a', isCorrect: true },
          { questionId: 'question-2', selectedOption: 'b', correctOption: 'b', isCorrect: true },
          { questionId: 'question-3', selectedOption: 'c', correctOption: 'c', isCorrect: true },
          { questionId: 'question-4', selectedOption: 'd', correctOption: 'd', isCorrect: true },
          { questionId: 'question-5', selectedOption: 'b', correctOption: 'a', isCorrect: false },
        ],
        nodeProgress: {
          id: 'progress-1',
          roadmapNodeId: nodeId,
          status: NodeStatus.COMPLETED,
          startedAt,
          completedAt,
          quizScorePct: 80,
          quizPassed: true,
        },
        unlockedNodes: [],
        suggestion: null,
      });
      expect(txMock.dailyActivity.upsert).toHaveBeenCalledTimes(1);
    });

    it('should pass at exactly 60 percent', async () => {
      txMock.userNodeProgress.update.mockResolvedValue({
        ...updatedProgress,
        quizScorePct: createDecimal(60),
        quizPassed: true,
      });

      const result = await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { questionId: 'question-1', selectedOption: 'A' },
          { questionId: 'question-2', selectedOption: 'B' },
          { questionId: 'question-3', selectedOption: 'C' },
          { questionId: 'question-4', selectedOption: 'A' },
          { questionId: 'question-5', selectedOption: 'B' },
        ],
      });

      expect(result.scorePct).toBe(60);
      expect(result.passed).toBe(true);
      expect(txMock.userNodeProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expectObjectContaining({
            status: NodeStatus.COMPLETED,
            completedAt: expectAnyDate(),
            quizScorePct: 60,
            quizPassed: true,
          }),
        }),
      );
    });

    it('should return unlocked nodes when a passing quiz completes the current group', async () => {
      txMock.roadmapNode.findFirst
        .mockResolvedValueOnce({ nodeType: NodeType.REQUIRED, parentId: 'group-1', posY: 50 })
        .mockResolvedValueOnce({ parentId: null, posY: 100 });
      txMock.roadmapNode.findMany
        .mockResolvedValueOnce([{ id: nodeId }])
        .mockResolvedValueOnce([{ id: 'group-2', nodeType: NodeType.GROUP, posY: 200 }]);
      txMock.userNodeProgress.count.mockResolvedValue(1);
      txMock.userNodeProgress.findUnique.mockResolvedValueOnce({
        status: NodeStatus.IN_PROGRESS,
      });
      txMock.userNodeProgress.findMany
        .mockResolvedValueOnce([{ roadmapNodeId: 'same-group-optional' }])
        .mockResolvedValueOnce([{ roadmapNodeId: 'next-group-leaf' }]);

      const result = await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto);

      expect(result.unlockedNodes).toEqual([
        'group-1',
        'same-group-optional',
        'group-2',
        'next-group-leaf',
      ]);
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(1, {
        where: { userId: MOCK_USER_ID, roadmapNodeId: 'group-1', status: NodeStatus.LOCKED },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(2, {
        where: { userId: MOCK_USER_ID, roadmapNodeId: { in: ['same-group-optional'] } },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(3, {
        where: { userId: MOCK_USER_ID, roadmapNodeId: 'group-2', status: NodeStatus.LOCKED },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
      expect(txMock.userNodeProgress.updateMany).toHaveBeenNthCalledWith(4, {
        where: { userId: MOCK_USER_ID, roadmapNodeId: { in: ['next-group-leaf'] } },
        data: { status: NodeStatus.IN_PROGRESS, startedAt: expectAnyDate() },
      });
    });

    it('should return a suggestion and quizPassed=false when score is below 60', async () => {
      txMock.userNodeProgress.update.mockResolvedValue({
        ...updatedProgress,
        status: NodeStatus.IN_PROGRESS,
        completedAt: null,
        quizScorePct: createDecimal(40),
        quizPassed: false,
      });

      const result = await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { questionId: 'question-1', selectedOption: 'A' },
          { questionId: 'question-2', selectedOption: 'B' },
          { questionId: 'question-3', selectedOption: 'A' },
          { questionId: 'question-4', selectedOption: 'A' },
          { questionId: 'question-5', selectedOption: 'B' },
        ],
      });

      expect(result).toEqual(
        expect.objectContaining({
          scorePct: 40,
          passed: false,
          correctCount: 2,
          suggestion: 'You should review this part before continuing.',
        }),
      );
      expect(result.nodeProgress.quizPassed).toBe(false);
      expect(result.nodeProgress.status).toBe(NodeStatus.IN_PROGRESS);
      expect(result.nodeProgress.completedAt).toBeNull();
      expect(result.unlockedNodes).toEqual([]);
      expect(txMock.dailyActivity.upsert).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
    });

    it('should overwrite the previous quiz score on re-submission', async () => {
      txMock.userNodeProgress.update
        .mockResolvedValueOnce({
          ...updatedProgress,
          status: NodeStatus.IN_PROGRESS,
          completedAt: null,
          quizScorePct: createDecimal(40),
          quizPassed: false,
        })
        .mockResolvedValueOnce({
          ...updatedProgress,
          quizScorePct: createDecimal(100),
          quizPassed: true,
        });

      await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { questionId: 'question-1', selectedOption: 'A' },
          { questionId: 'question-2', selectedOption: 'B' },
          { questionId: 'question-3', selectedOption: 'A' },
          { questionId: 'question-4', selectedOption: 'A' },
          { questionId: 'question-5', selectedOption: 'B' },
        ],
      });
      const secondResult = await service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
        answers: [
          { questionId: 'question-1', selectedOption: 'A' },
          { questionId: 'question-2', selectedOption: 'B' },
          { questionId: 'question-3', selectedOption: 'C' },
          { questionId: 'question-4', selectedOption: 'D' },
          { questionId: 'question-5', selectedOption: 'A' },
        ],
      });

      expect(txMock.userNodeProgress.update).toHaveBeenCalledTimes(2);
      expect(txMock.userNodeProgress.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expectObjectContaining({
            status: NodeStatus.COMPLETED,
            completedAt: expectAnyDate(),
            quizScorePct: 100,
            quizPassed: true,
          }),
        }),
      );
      expect(secondResult.nodeProgress.quizScorePct).toBe(100);
      expect(secondResult.nodeProgress.status).toBe(NodeStatus.COMPLETED);
    });

    it('should throw 404 when node is not found in the roadmap', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto),
      ).rejects.toThrow(RoadmapNodeNotFoundException);
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 422 for group nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.GROUP,
        skillId: null,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto),
      ).rejects.toMatchObject({ status: 422 });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });

    it('should throw 422 for milestone nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto),
      ).rejects.toMatchObject({ status: 422 });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
    });

    it('should throw 422 for locked leaf nodes', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId,
        userNodeProgress: [{ status: NodeStatus.LOCKED }],
      });

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto),
      ).rejects.toMatchObject({ status: 422 });
      expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 400 when submitted questions do not all match the node skill', async () => {
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions.slice(0, 4));

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, submitDto),
      ).rejects.toThrow(QuizSubmissionInvalidException);
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 400 for duplicate question ids', async () => {
      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: [
            { questionId: 'question-1', selectedOption: 'A' },
            { questionId: 'question-1', selectedOption: 'B' },
            { questionId: 'question-3', selectedOption: 'C' },
            { questionId: 'question-4', selectedOption: 'D' },
            { questionId: 'question-5', selectedOption: 'A' },
          ],
        }),
      ).rejects.toThrow(QuizSubmissionInvalidException);
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 400 for missing question ids', async () => {
      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: submitDto.answers.slice(0, 4),
        }),
      ).rejects.toThrow(QuizSubmissionInvalidException);
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 400 for extra question ids', async () => {
      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: [...submitDto.answers, { questionId: 'question-6', selectedOption: 'A' }],
        }),
      ).rejects.toThrow(QuizSubmissionInvalidException);
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should throw 400 for unknown question ids', async () => {
      prisma.quizQuestion.findMany.mockResolvedValue(mockQuestions.slice(0, 4));

      await expect(
        service.submitNodeQuiz(MOCK_USER_ID, roadmapId, nodeId, {
          answers: [
            { questionId: 'question-1', selectedOption: 'A' },
            { questionId: 'question-2', selectedOption: 'B' },
            { questionId: 'question-3', selectedOption: 'C' },
            { questionId: 'question-4', selectedOption: 'D' },
            { questionId: 'unknown-question', selectedOption: 'A' },
          ],
        }),
      ).rejects.toThrow(QuizSubmissionInvalidException);
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });
  });

  describe('milestone test result parsing', () => {
    const parseMilestoneTestResult = (): ParseMilestoneTestResult => {
      return parseMilestoneTestResultOutput;
    };

    it('should accept valid marker JSON with six detailed test results', () => {
      const result = parseMilestoneTestResult()(`noise\n${makeMilestoneResultMarker(5)}\n`);

      expect(result).toEqual(makeParsedMilestoneTestResult(5));
    });

    it('should reject missing marker output', () => {
      expect(parseMilestoneTestResult()('generated tests completed without a marker')).toBeNull();
    });

    it('should reject invalid marker JSON', () => {
      expect(parseMilestoneTestResult()('RMAP_MILESTONE_RESULTS:{not-json')).toBeNull();
    });

    it('should reject wrong total count', () => {
      expect(
        parseMilestoneTestResult()(
          makeMilestoneResultMarkerFromPayload({
            ...makeMilestoneResultPayload(5),
            totalTests: 5,
          }),
        ),
      ).toBeNull();
    });

    it('should reject pass count mismatches', () => {
      expect(
        parseMilestoneTestResult()(
          makeMilestoneResultMarkerFromPayload({
            ...makeMilestoneResultPayload(5),
            passedTests: 6,
          }),
        ),
      ).toBeNull();
    });

    it.each([
      ['negative pass count', -1],
      ['pass count above total', 7],
      ['non-integer pass count', 4.5],
    ])('should reject %s', (_label, passedTests) => {
      expect(
        parseMilestoneTestResult()(
          makeMilestoneResultMarkerFromPayload({
            ...makeMilestoneResultPayload(5),
            passedTests,
          }),
        ),
      ).toBeNull();
    });

    it.each([
      [
        'missing tests array',
        {
          totalTests: 6,
          passedTests: 6,
        },
      ],
      [
        'wrong test entry count',
        {
          totalTests: 6,
          passedTests: 5,
          tests: makeMilestoneTestResults(5).slice(0, 5),
        },
      ],
      [
        'empty test name',
        {
          ...makeMilestoneResultPayload(5),
          tests: [
            { ...makeMilestoneTestResults(5)[0], name: ' ' },
            ...makeMilestoneTestResults(5).slice(1),
          ],
        },
      ],
      [
        'non-boolean passed value',
        {
          ...makeMilestoneResultPayload(5),
          tests: [
            { ...makeMilestoneTestResults(5)[0], passed: 'true' },
            ...makeMilestoneTestResults(5).slice(1),
          ],
        },
      ],
      [
        'non-string message',
        {
          ...makeMilestoneResultPayload(5),
          tests: [
            { ...makeMilestoneTestResults(5)[0], message: null },
            ...makeMilestoneTestResults(5).slice(1),
          ],
        },
      ],
    ])('should reject malformed test entries: %s', (_label, payload) => {
      expect(parseMilestoneTestResult()(makeMilestoneResultMarkerFromPayload(payload))).toBeNull();
    });
  });

  describe('submitMilestoneSubmission', () => {
    const nodeId = 'milestone-1';
    const roadmapId = 'roadmap-1';
    const startedAt = new Date('2026-01-03T00:00:00Z');
    const createdAt = new Date('2026-01-04T00:00:00Z');
    const submission = {
      id: 'submission-1',
      repoUrl: 'https://github.com/acme/api-project',
      testSuiteId: 'suite-1',
      status: MilestoneSubmissionStatus.RUNNING,
      outputLog: null,
      passRatePct: null,
      passedTests: null,
      testResults: null,
      totalTests: null,
      attemptNumber: 3,
      createdAt,
      completedAt: null,
    } satisfies MilestoneSubmissionSelection;

    beforeEach(() => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        description: 'Build and test an API',
        name: 'API Capstone',
        nodeType: NodeType.MILESTONE,
        roadmap: { roleCategory: RoleCategory.WEB_DEVELOPMENT },
        milestoneTestSuite: makeMilestoneTestSuite({ roadmapNodeId: nodeId }),
        skillId: null,
        userNodeProgress: [{ startedAt, status: NodeStatus.IN_PROGRESS }],
      });
      txMock.milestoneSubmission.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ attemptNumber: 2 });
      txMock.milestoneSubmission.create.mockResolvedValue(submission);
      txMock.userNodeProgress.findUnique.mockResolvedValue({
        startedAt,
        status: NodeStatus.IN_PROGRESS,
      });
      jest.spyOn(milestoneService, 'executeMilestoneSubmission').mockResolvedValue(undefined);
    });

    it('should create a running submission and queue async execution', async () => {
      const result = await service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
        repoUrl: 'https://github.com/acme/api-project',
      });

      expect(txMock.milestoneSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            attemptNumber: 3,
            repoUrl: 'https://github.com/acme/api-project',
            roadmapNodeId: nodeId,
            status: MilestoneSubmissionStatus.RUNNING,
            testCommand: 'node .rmap/milestone-test.mjs',
            testSuiteId: 'suite-1',
            userId: MOCK_USER_ID,
          },
        }),
      );
      expect(milestoneService.executeMilestoneSubmission).toHaveBeenCalledWith('submission-1');
      expect(result).toEqual({
        submission: {
          ...submission,
          createdAt: createdAt.toISOString(),
          completedAt: null,
        },
      });
      expect(txMock.$queryRaw).toHaveBeenCalled();
    });

    it('should reject non-GitHub repo URLs with a custom exception', async () => {
      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://example.com/acme/api-project',
        }),
      ).rejects.toThrow(MilestoneSubmissionInvalidUrlException);
      expect(prisma.roadmapNode.findFirst).not.toHaveBeenCalled();
    });

    it('should throw RoadmapNodeNotFoundException when the node is not owned by the user', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(RoadmapNodeNotFoundException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });

    it('should reject non-milestone project submissions with a custom exception', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
        skillId: 'skill-1',
        userNodeProgress: [{ status: NodeStatus.IN_PROGRESS }],
      });

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(MilestoneSubmissionInvalidStateException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });

    it('should reject locked milestone submissions with the transition exception', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
        userNodeProgress: [{ status: NodeStatus.LOCKED }],
      });

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(InvalidStatusTransitionException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });

    it('should reject concurrent running submissions with a custom exception', async () => {
      txMock.milestoneSubmission.findFirst.mockReset();
      txMock.milestoneSubmission.findFirst.mockResolvedValueOnce({ id: 'running-submission' });

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(MilestoneSubmissionInProgressException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });

    it('should reject submission when progress was deleted before the transaction acquired its lock', async () => {
      txMock.userNodeProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(UserNodeProgressNotFoundException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });

    it('should reject submission when progress was reset and restarted before the transaction lock', async () => {
      txMock.userNodeProgress.findUnique.mockResolvedValue({
        startedAt: new Date('2026-01-05T00:00:00Z'),
        status: NodeStatus.IN_PROGRESS,
      });

      await expect(
        service.submitMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId, {
          repoUrl: 'https://github.com/acme/api-project',
        }),
      ).rejects.toThrow(AppConflictException);
      expect(txMock.milestoneSubmission.create).not.toHaveBeenCalled();
    });
  });

  describe('getLatestMilestoneSubmission', () => {
    const nodeId = 'milestone-1';
    const roadmapId = 'roadmap-1';

    it('should return the latest submission for a milestone node', async () => {
      const createdAt = new Date('2026-01-04T00:00:00Z');
      const completedAt = new Date('2026-01-04T00:01:00Z');

      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
        userNodeProgress: [
          {
            startedAt: new Date('2026-01-01T00:00:00Z'),
            status: NodeStatus.IN_PROGRESS,
          },
        ],
      });
      prisma.milestoneSubmission.findFirst.mockResolvedValue({
        id: 'submission-1',
        repoUrl: 'https://github.com/acme/api-project',
        testSuiteId: 'suite-1',
        status: MilestoneSubmissionStatus.PASSED,
        outputLog: 'ok',
        passRatePct: 83.33,
        passedTests: 5,
        testResults: makeMilestoneTestResults(5),
        totalTests: 6,
        attemptNumber: 1,
        createdAt,
        completedAt,
      });

      const result = await service.getLatestMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId);

      expect(prisma.milestoneSubmission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { gte: new Date('2026-01-01T00:00:00Z') },
            roadmapNodeId: nodeId,
            userId: MOCK_USER_ID,
          },
        }),
      );
      expect(result).toEqual({
        submission: {
          id: 'submission-1',
          repoUrl: 'https://github.com/acme/api-project',
          testSuiteId: 'suite-1',
          status: MilestoneSubmissionStatus.PASSED,
          outputLog: 'ok',
          passRatePct: 83.33,
          passedTests: 5,
          testResults: makeMilestoneTestResults(5),
          totalTests: 6,
          attemptNumber: 1,
          createdAt: createdAt.toISOString(),
          completedAt: completedAt.toISOString(),
        },
      });
    });

    it('should not return an old submission before the current milestone is started', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
        skillId: null,
        userNodeProgress: [
          {
            startedAt: null,
            status: NodeStatus.LOCKED,
          },
        ],
      });

      await expect(
        service.getLatestMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId),
      ).resolves.toEqual({ submission: null });
      expect(prisma.milestoneSubmission.findFirst).not.toHaveBeenCalled();
    });

    it('should throw RoadmapNodeNotFoundException when the node is not owned by the user', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.getLatestMilestoneSubmission(MOCK_USER_ID, roadmapId, nodeId),
      ).rejects.toThrow(RoadmapNodeNotFoundException);
      expect(prisma.milestoneSubmission.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('milestone evaluator execution', () => {
    const executeMilestoneSubmission = (): ExecuteMilestoneSubmission => {
      return (submissionId: string) => milestoneService.executeMilestoneSubmission(submissionId);
    };

    beforeEach(() => {
      prisma.milestoneSubmission.findUnique.mockResolvedValue({
        id: 'submission-1',
        repoUrl: 'https://github.com/acme/api-project',
        roadmapNodeId: 'milestone-1',
        testSuite: {
          id: 'suite-1',
          passThresholdPct: 80,
          testFileContent: `console.log('${makeMilestoneResultMarker(6)}');`,
        },
        userId: MOCK_USER_ID,
      });
      txMock.milestoneSubmission.update.mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      });
    });

    it('should call the runner and complete a passing submission', async () => {
      const testResult = makeParsedMilestoneTestResult(6);
      milestoneExecutionClient.execute.mockResolvedValue({
        outputLog: 'ok',
        passRatePct: testResult.passRatePct,
        passedTests: testResult.passedTests,
        status: MilestoneSubmissionStatus.PASSED,
        testResults: testResult.testResults,
        totalTests: testResult.totalTests,
      });
      txMock.userNodeProgress.findUnique.mockResolvedValue({
        startedAt: new Date('2026-01-03T00:00:00Z'),
        status: NodeStatus.IN_PROGRESS,
      });
      txMock.roadmapNode.findFirst.mockResolvedValue({
        nodeType: NodeType.MILESTONE,
        parentId: null,
        posY: 150,
      });
      txMock.userNodeProgress.findMany.mockResolvedValue([]);

      await executeMilestoneSubmission()('submission-1');

      expect(milestoneExecutionClient.execute).toHaveBeenCalledWith({
        repoUrl: 'https://github.com/acme/api-project',
        submissionId: 'submission-1',
        testFileContent: `console.log('${makeMilestoneResultMarker(6)}');`,
        timeoutMs: 120_000,
      });
      expect(txMock.milestoneSubmission.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            passRatePct: 100,
            passedTests: 6,
            status: MilestoneSubmissionStatus.PASSED,
            totalTests: 6,
          }),
        }),
      );
    });

    it('should record runner failures without completing progress', async () => {
      milestoneExecutionClient.execute.mockResolvedValue({
        outputLog: '\n[error]\nEvaluator is unavailable.\n',
        passRatePct: null,
        passedTests: null,
        status: MilestoneSubmissionStatus.ERROR,
        testResults: null,
        totalTests: null,
      });

      await executeMilestoneSubmission()('submission-1');

      expect(txMock.milestoneSubmission.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            outputLog: '\n[error]\nEvaluator is unavailable.\n',
            passRatePct: undefined,
            passedTests: undefined,
            status: MilestoneSubmissionStatus.ERROR,
            testResults: undefined,
            totalTests: undefined,
          }),
        }),
      );
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
    });

    it('should mark missing generated test content as an error', async () => {
      prisma.milestoneSubmission.findUnique.mockResolvedValue({
        id: 'submission-1',
        repoUrl: 'https://github.com/acme/api-project',
        roadmapNodeId: 'milestone-1',
        testSuite: {
          id: 'suite-1',
          passThresholdPct: 80,
          testFileContent: null,
        },
        userId: MOCK_USER_ID,
      });

      await executeMilestoneSubmission()('submission-1');

      expect(milestoneExecutionClient.execute).not.toHaveBeenCalled();
      expect(txMock.milestoneSubmission.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            status: MilestoneSubmissionStatus.ERROR,
          }),
        }),
      );
    });
  });

  describe('milestone submission completion', () => {
    const completeMilestoneSubmission = (): CompleteMilestoneSubmission => {
      return (
        submissionId: string,
        status: MilestoneSubmissionStatus,
        outputLog: string,
        testResult?: Parameters<CompleteMilestoneSubmission>[3],
      ) =>
        milestoneService.completeMilestoneSubmission(submissionId, status, outputLog, testResult);
    };

    it('should auto-complete the milestone and unlock next nodes when generated tests pass', async () => {
      txMock.milestoneSubmission.update.mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      });
      txMock.userNodeProgress.findUnique.mockResolvedValue({
        startedAt: new Date('2026-01-03T00:00:00Z'),
        status: NodeStatus.IN_PROGRESS,
      });
      txMock.roadmapNode.findFirst
        .mockResolvedValueOnce({
          nodeType: NodeType.MILESTONE,
          parentId: null,
          posY: 150,
        })
        .mockResolvedValueOnce({ id: 'group-2' });
      txMock.userNodeProgress.findMany.mockResolvedValueOnce([{ roadmapNodeId: 'leaf-4' }]);

      const testResult = makeParsedMilestoneTestResult(5);

      await completeMilestoneSubmission()(
        'submission-1',
        MilestoneSubmissionStatus.PASSED,
        'ok',
        testResult,
      );

      expect(txMock.milestoneSubmission.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            passRatePct: 83.33,
            passedTests: 5,
            status: MilestoneSubmissionStatus.PASSED,
            testResults: testResult.testResults,
            totalTests: 6,
          }),
        }),
      );
      expect(txMock.userNodeProgress.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({ status: NodeStatus.COMPLETED }),
          where: {
            userId_roadmapNodeId: {
              roadmapNodeId: 'milestone-1',
              userId: MOCK_USER_ID,
            },
          },
        }),
      );
      expect(txMock.userNodeProgress.updateMany).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({ status: NodeStatus.IN_PROGRESS }),
          where: { userId: MOCK_USER_ID, roadmapNodeId: { in: ['leaf-4'] } },
        }),
      );
    });

    it('should record failed generated test metrics without completing progress', async () => {
      txMock.milestoneSubmission.update.mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      });

      const testResult = makeParsedMilestoneTestResult(4);

      await completeMilestoneSubmission()(
        'submission-1',
        MilestoneSubmissionStatus.FAILED,
        'no',
        testResult,
      );

      expect(txMock.milestoneSubmission.update).toHaveBeenCalledWith(
        expectObjectContaining({
          data: expectObjectContaining({
            passRatePct: 66.67,
            passedTests: 4,
            status: MilestoneSubmissionStatus.FAILED,
            testResults: testResult.testResults,
            totalTests: 6,
          }),
        }),
      );
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
    });

    it('should complete a passing submission without recreating progress after a reset', async () => {
      txMock.milestoneSubmission.update.mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      });
      txMock.userNodeProgress.findUnique.mockResolvedValue(null);

      await completeMilestoneSubmission()(
        'submission-1',
        MilestoneSubmissionStatus.PASSED,
        'ok',
        makeParsedMilestoneTestResult(6),
      );

      expect(txMock.milestoneSubmission.update).toHaveBeenCalled();
      expect(txMock.$queryRaw).toHaveBeenCalled();
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
    });

    it('should not complete restarted progress with an older passing submission', async () => {
      txMock.milestoneSubmission.update.mockResolvedValue({
        createdAt: new Date('2026-01-04T00:00:00Z'),
        roadmapNode: { roadmapId: 'roadmap-1' },
        roadmapNodeId: 'milestone-1',
        userId: MOCK_USER_ID,
      });
      txMock.userNodeProgress.findUnique.mockResolvedValue({
        startedAt: new Date('2026-01-05T00:00:00Z'),
        status: NodeStatus.IN_PROGRESS,
      });

      await completeMilestoneSubmission()(
        'submission-1',
        MilestoneSubmissionStatus.PASSED,
        'ok',
        makeParsedMilestoneTestResult(6),
      );

      expect(txMock.milestoneSubmission.update).toHaveBeenCalled();
      expect(txMock.$queryRaw).toHaveBeenCalled();
      expect(txMock.userNodeProgress.update).not.toHaveBeenCalled();
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('updateNodeProgress', () => {
    const nodeId = 'node-1';
    const roadmapId = 'roadmap-1';
    const groupId = 'group-1';

    const mockNode: RoadmapNodeQuizSelection = {
      id: nodeId,
      nodeType: NodeType.REQUIRED,
      skillId: null,
      parentId: groupId,
    };
    const mockUpdatedProgress = {
      id: 'progress-1',
      roadmapNodeId: nodeId,
      status: NodeStatus.COMPLETED,
      startedAt: new Date('2026-01-01T00:00:00Z'),
      completedAt: new Date('2026-01-02T00:00:00Z'),
      quizScorePct: null,
      quizPassed: true,
    };

    beforeEach(() => {
      prisma.roadmapNode.findFirst.mockResolvedValue(mockNode);
      prisma.userNodeProgress.findUnique.mockResolvedValue({
        status: NodeStatus.IN_PROGRESS,
        quizPassed: true,
      });
      txMock.userNodeProgress.update.mockResolvedValue(mockUpdatedProgress);
      txMock.roadmapNode.findFirst.mockResolvedValue({
        nodeType: NodeType.REQUIRED,
        parentId: groupId,
        posY: 50,
      });
      // Default: 2 required children, 1 completed → no cascade
      txMock.roadmapNode.findMany.mockResolvedValue([{ id: nodeId }, { id: 'other-leaf' }]);
      txMock.userNodeProgress.count.mockResolvedValue(1);
    });

    it('should throw RoadmapNodeNotFoundException when the node is not found', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.COMPLETED,
        }),
      ).rejects.toThrow(RoadmapNodeNotFoundException);
      expect(prisma.userNodeProgress.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UserNodeProgressNotFoundException when the progress record is not found', async () => {
      prisma.userNodeProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.COMPLETED,
        }),
      ).rejects.toThrow(UserNodeProgressNotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw InvalidStatusTransitionException for an invalid transition (COMPLETED → IN_PROGRESS)', async () => {
      prisma.userNodeProgress.findUnique.mockResolvedValue({
        status: NodeStatus.COMPLETED,
        quizPassed: true,
      });

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(InvalidStatusTransitionException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw QuizNotPassedException when completing a leaf without quiz passed', async () => {
      prisma.userNodeProgress.findUnique.mockResolvedValue({
        status: NodeStatus.IN_PROGRESS,
        quizPassed: false,
      });

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.COMPLETED,
        }),
      ).rejects.toThrow(QuizNotPassedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reject direct GROUP progress updates', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.GROUP,
        skillId: null,
        parentId: null,
      });

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.COMPLETED,
        }),
      ).rejects.toThrow(RoadmapNodeProgressInvalidUpdateException);
      expect(prisma.userNodeProgress.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(txMock.dailyActivity.upsert).not.toHaveBeenCalled();
    });

    it('should reject client-driven LOCKED → IN_PROGRESS transitions', async () => {
      prisma.userNodeProgress.findUnique.mockResolvedValue({
        status: NodeStatus.LOCKED,
        quizPassed: null,
      });

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
          status: NodeStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(InvalidStatusTransitionException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(txMock.dailyActivity.upsert).not.toHaveBeenCalled();
    });

    it('should upsert daily_activity when a leaf node completes', async () => {
      await service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
        status: NodeStatus.COMPLETED,
      });

      expect(txMock.dailyActivity.upsert).toHaveBeenCalledTimes(1);
      expect(txMock.dailyActivity.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_activityDate: { userId: MOCK_USER_ID, activityDate: expectAnyDate() },
          },
          create: expectObjectContaining({ nodesCompleted: 1 }),
          update: { nodesCompleted: { increment: 1 } },
        }),
      );
    });

    it('should return empty unlockedNodes when not all required leaves are done', async () => {
      // Default beforeEach: 2 required children, count=1 → cascade aborts early
      const result = await service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
        status: NodeStatus.COMPLETED,
      });

      expect(result.unlockedNodes).toEqual([]);
      expect(txMock.userNodeProgress.updateMany).not.toHaveBeenCalled();
    });

    it('should auto-complete the group and unlock next GROUP leaves when all required leaves complete', async () => {
      txMock.roadmapNode.findMany
        .mockResolvedValueOnce([{ id: nodeId }]) // required children of group-1 (only 1)
        .mockResolvedValueOnce([{ id: 'group-2', nodeType: NodeType.GROUP, posY: 200 }]); // next siblings

      txMock.userNodeProgress.count.mockResolvedValue(1); // 1 of 1 done → cascade triggers
      txMock.roadmapNode.findFirst
        .mockResolvedValueOnce({ nodeType: NodeType.REQUIRED, parentId: groupId, posY: 50 })
        .mockResolvedValueOnce({ parentId: null, posY: 100 }); // group-1 info
      txMock.userNodeProgress.findUnique.mockResolvedValueOnce({ status: NodeStatus.IN_PROGRESS }); // group not yet completed
      txMock.userNodeProgress.findMany
        .mockResolvedValueOnce([]) // LOCKED leaves of group-1
        .mockResolvedValueOnce([{ roadmapNodeId: 'leaf-2' }, { roadmapNodeId: 'leaf-3' }]); // LOCKED leaves of group-2

      const result = await service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
        status: NodeStatus.COMPLETED,
      });

      expect(txMock.userNodeProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_roadmapNodeId: { userId: MOCK_USER_ID, roadmapNodeId: groupId } },
          data: expectObjectContaining({ status: NodeStatus.COMPLETED }),
        }),
      );
      expect(txMock.userNodeProgress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID, roadmapNodeId: { in: ['leaf-2', 'leaf-3'] } },
          data: expectObjectContaining({ status: NodeStatus.IN_PROGRESS }),
        }),
      );
      expect(result.unlockedNodes).toEqual(['group-1', 'group-2', 'leaf-2', 'leaf-3']);
    });

    it('should unlock milestone without unlocking next GROUP when milestone follows the completed group', async () => {
      const milestoneId = 'milestone-1';
      const nextGroupId = 'group-2';

      txMock.roadmapNode.findMany
        .mockResolvedValueOnce([{ id: nodeId }]) // required children of group-1
        .mockResolvedValueOnce([
          { id: milestoneId, nodeType: NodeType.MILESTONE, posY: 150 },
          { id: nextGroupId, nodeType: NodeType.GROUP, posY: 200 },
        ]); // next siblings: milestone first, then group

      txMock.userNodeProgress.count.mockResolvedValue(1);
      txMock.roadmapNode.findFirst
        .mockResolvedValueOnce({ nodeType: NodeType.REQUIRED, parentId: groupId, posY: 50 })
        .mockResolvedValueOnce({ parentId: null, posY: 100 });
      txMock.userNodeProgress.findUnique.mockResolvedValueOnce({ status: NodeStatus.IN_PROGRESS }); // group not yet completed
      txMock.userNodeProgress.findMany.mockResolvedValueOnce([]); // LOCKED leaves of group-1
      txMock.userNodeProgress.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.updateNodeProgress(MOCK_USER_ID, roadmapId, nodeId, {
        status: NodeStatus.COMPLETED,
      });

      expect(txMock.userNodeProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_roadmapNodeId: { userId: MOCK_USER_ID, roadmapNodeId: 'group-1' } },
        }),
      );
      expect(txMock.userNodeProgress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: MOCK_USER_ID,
            roadmapNodeId: milestoneId,
            status: NodeStatus.LOCKED,
          },
          data: expectObjectContaining({ status: NodeStatus.IN_PROGRESS }),
        }),
      );
      expect(txMock.userNodeProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectObjectContaining({
            roadmapNode: {
              parentId: groupId,
              nodeType: { in: [NodeType.REQUIRED, NodeType.OPTIONAL] },
            },
          }),
        }),
      );
      expect(result.unlockedNodes).toEqual(['group-1', milestoneId]);
    });

    it('should reject manual milestone completion because generated tests complete it automatically', async () => {
      const milestoneId = 'milestone-1';

      prisma.userNodeProgress.findUnique.mockResolvedValue({
        status: NodeStatus.IN_PROGRESS,
        quizPassed: null,
      });
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: milestoneId,
        nodeType: NodeType.MILESTONE,
        parentId: null,
        posY: 150,
        skillId: null,
      });

      await expect(
        service.updateNodeProgress(MOCK_USER_ID, roadmapId, milestoneId, {
          status: NodeStatus.COMPLETED,
        }),
      ).rejects.toThrow(RoadmapNodeProgressInvalidUpdateException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
