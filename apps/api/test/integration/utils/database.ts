import type { User } from '@repo/db/prisma/client';

import {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
  QuizGenerationStatus,
  ResourceType,
  RoleCategory,
  UserRole,
} from '@repo/db/prisma/client';
import * as bcrypt from 'bcrypt';

import type { PrismaService } from '@/modules/prisma/prisma.service';

export const INTEGRATION_PASSWORD = 'CorrectHorseBattery1!';

type SeededRoadmapWorkflow = {
  completedNodeId: string;
  groupNodeId: string;
  roadmapId: string;
  templateId: string;
  templateNodeId: string;
  user: User;
};

type SeededRoadmapLearningGraph = {
  groupNodeId: string;
  milestoneNodeId: string;
  nextGroupNodeId: string;
  nextRequiredNodeId: string;
  optionalNodeId: string;
  prerequisiteSkillId: string;
  requiredNodeId: string;
  requiredSkillId: string;
  roadmapId: string;
  user: User;
};

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}.${suffix}@example.test`;
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  assertSafeToResetDatabase();

  await prisma.milestoneSubmission.deleteMany();
  await prisma.milestoneTestSuite.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.userNodeProgress.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.roadmapNode.deleteMany();
  await prisma.roadmap.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.skillPrerequisite.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();
}

export function getDatabaseSafetySkipReason(): null | string {
  const databaseUrl = process.env.DATABASE_URL;

  if (process.env.NODE_ENV !== 'test') {
    return 'NODE_ENV must be test.';
  }

  if (!databaseUrl) {
    return 'DATABASE_URL must point to an isolated integration test database.';
  }

  if (!databaseUrl.toLowerCase().includes('test') && !allowsDatabaseReset()) {
    return (
      'DATABASE_URL must contain "test", or INTEGRATION_ALLOW_DB_RESET=true must be set ' +
      'for a disposable database.'
    );
  }

  return null;
}

export async function seedUser(
  prisma: PrismaService,
  options: { email?: string; fullName?: string; role?: UserRole } = {},
): Promise<User> {
  return prisma.user.create({
    data: {
      avatarUrl: `https://api.dicebear.com/10.x/adventurer/svg?seed=${encodeURIComponent(
        options.fullName ?? 'Integration User',
      )}`,
      email: options.email ?? uniqueEmail('user'),
      fullName: options.fullName ?? 'Integration User',
      passwordHash: await bcrypt.hash(INTEGRATION_PASSWORD, 10),
      role: options.role ?? UserRole.USER,
    },
  });
}

export async function seedRoadmapWorkflow(prisma: PrismaService): Promise<SeededRoadmapWorkflow> {
  const user = await seedUser(prisma, { fullName: 'Learner One' });
  const skill = await prisma.skill.create({
    data: {
      defaultEstimatedHours: 4,
      description: 'HTTP fundamentals for integration tests',
      name: `HTTP Basics ${Date.now()}-${Math.random().toString(16).slice(2)}`,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      description: 'A seeded learner roadmap',
      deadlineDate: new Date('2026-12-31T00:00:00.000Z'),
      estimatedWeeks: 4,
      goalName: 'Backend-ready web developer',
      hoursPerDay: 2,
      isTemplate: false,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Seeded Learner Roadmap',
      userId: user.id,
    },
  });

  const groupNode = await prisma.roadmapNode.create({
    data: {
      description: 'Foundation group',
      name: 'Foundations',
      nodeType: NodeType.GROUP,
      posX: 0,
      posY: 0,
      roadmapId: roadmap.id,
    },
  });

  const completedNode = await prisma.roadmapNode.create({
    data: {
      estimatedHours: 4,
      name: 'HTTP Basics',
      nodeType: NodeType.REQUIRED,
      parentId: groupNode.id,
      posX: 100,
      posY: 100,
      roadmapId: roadmap.id,
      skillId: skill.id,
    },
  });

  await prisma.userNodeProgress.createMany({
    data: [
      {
        roadmapNodeId: groupNode.id,
        startedAt: new Date('2026-05-29T00:00:00.000Z'),
        status: NodeStatus.IN_PROGRESS,
        userId: user.id,
      },
      {
        completedAt: new Date('2026-05-30T00:00:00.000Z'),
        roadmapNodeId: completedNode.id,
        startedAt: new Date('2026-05-29T00:00:00.000Z'),
        status: NodeStatus.COMPLETED,
        userId: user.id,
      },
    ],
  });

  await prisma.dailyActivity.createMany({
    data: [
      {
        activityDate: new Date('2026-05-29T00:00:00.000Z'),
        nodesCompleted: 1,
        userId: user.id,
      },
      {
        activityDate: new Date('2026-05-30T00:00:00.000Z'),
        nodesCompleted: 2,
        userId: user.id,
      },
    ],
  });

  const template = await prisma.roadmap.create({
    data: {
      description: 'A seeded public template',
      estimatedWeeks: 6,
      isTemplate: true,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Seeded Template',
    },
  });

  const templateNode = await prisma.roadmapNode.create({
    data: {
      description: 'Template group',
      name: 'Template Foundations',
      nodeType: NodeType.GROUP,
      posX: 0,
      posY: 0,
      roadmapId: template.id,
    },
  });

  return {
    completedNodeId: completedNode.id,
    groupNodeId: groupNode.id,
    roadmapId: roadmap.id,
    templateId: template.id,
    templateNodeId: templateNode.id,
    user,
  };
}

export async function seedRoadmapLearningGraph(
  prisma: PrismaService,
): Promise<SeededRoadmapLearningGraph> {
  const user = await seedUser(prisma, { fullName: 'Roadmap Learner' });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const prerequisiteSkill = await prisma.skill.create({
    data: {
      defaultEstimatedHours: 2,
      description: 'HTTP prerequisite for roadmap integration tests',
      name: `HTTP Prerequisite ${suffix}`,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    },
  });
  const requiredSkill = await prisma.skill.create({
    data: {
      defaultEstimatedHours: 6,
      description: 'HTTP APIs for roadmap integration tests',
      name: `HTTP APIs ${suffix}`,
      quizGeneratedAt: new Date('2026-05-01T00:00:00.000Z'),
      quizGenerationStatus: QuizGenerationStatus.READY,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    },
  });
  const nextSkill = await prisma.skill.create({
    data: {
      defaultEstimatedHours: 3,
      description: 'Frontend integration for roadmap integration tests',
      name: `Frontend Integration ${suffix}`,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    },
  });

  await prisma.skillPrerequisite.create({
    data: {
      prerequisiteSkillId: prerequisiteSkill.id,
      skillId: requiredSkill.id,
    },
  });
  await prisma.resource.createMany({
    data: [
      {
        isFree: true,
        isPrimary: true,
        resourceType: ResourceType.DOCS,
        skillId: requiredSkill.id,
        title: 'HTTP API Docs',
        url: 'https://example.test/http-docs',
      },
      {
        isFree: true,
        isPrimary: false,
        resourceType: ResourceType.ARTICLE,
        skillId: requiredSkill.id,
        title: 'HTTP API Article',
        url: 'https://example.test/http-article',
      },
      {
        isFree: false,
        isPrimary: false,
        resourceType: ResourceType.COURSE,
        skillId: requiredSkill.id,
        title: 'HTTP API Course',
        url: 'https://example.test/http-course',
      },
    ],
  });
  await prisma.quizQuestion.createMany({
    data: Array.from({ length: 5 }, (_value, index) => ({
      correctOption: 'A',
      optionA: `Correct ${index + 1}`,
      optionB: `Wrong B${index + 1}`,
      optionC: `Wrong C${index + 1}`,
      optionD: `Wrong D${index + 1}`,
      questionText: `HTTP API question ${index + 1}?`,
      skillId: requiredSkill.id,
    })),
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      deadlineDate: new Date('2026-12-31T00:00:00.000Z'),
      description: 'A seeded roadmap graph for integration tests',
      estimatedWeeks: 8,
      goalName: 'Master API delivery',
      hoursPerDay: 2,
      isTemplate: false,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Seeded Roadmap Graph',
      userId: user.id,
    },
  });
  const groupNode = await prisma.roadmapNode.create({
    data: {
      description: 'API foundations group',
      name: 'API Foundations',
      nodeType: NodeType.GROUP,
      posX: 0,
      posY: 0,
      roadmapId: roadmap.id,
    },
  });
  const requiredNode = await prisma.roadmapNode.create({
    data: {
      estimatedHours: 6,
      name: 'HTTP APIs',
      nodeType: NodeType.REQUIRED,
      parentId: groupNode.id,
      posX: 100,
      posY: 100,
      roadmapId: roadmap.id,
      skillId: requiredSkill.id,
    },
  });
  const optionalNode = await prisma.roadmapNode.create({
    data: {
      estimatedHours: 2,
      name: 'API Observability',
      nodeType: NodeType.OPTIONAL,
      parentId: groupNode.id,
      posX: 200,
      posY: 100,
      roadmapId: roadmap.id,
      skillId: requiredSkill.id,
    },
  });
  const milestoneNode = await prisma.roadmapNode.create({
    data: {
      description: 'Build and test a small HTTP API',
      name: 'API Capstone',
      nodeType: NodeType.MILESTONE,
      posX: 0,
      posY: 200,
      roadmapId: roadmap.id,
    },
  });
  const nextGroupNode = await prisma.roadmapNode.create({
    data: {
      description: 'Client integration group',
      name: 'Client Integration',
      nodeType: NodeType.GROUP,
      posX: 0,
      posY: 300,
      roadmapId: roadmap.id,
    },
  });
  const nextRequiredNode = await prisma.roadmapNode.create({
    data: {
      estimatedHours: 3,
      name: 'Frontend API Client',
      nodeType: NodeType.REQUIRED,
      parentId: nextGroupNode.id,
      posX: 100,
      posY: 400,
      roadmapId: roadmap.id,
      skillId: nextSkill.id,
    },
  });

  await prisma.userNodeProgress.createMany({
    data: [
      {
        roadmapNodeId: groupNode.id,
        startedAt: new Date('2026-05-01T00:00:00.000Z'),
        status: NodeStatus.IN_PROGRESS,
        userId: user.id,
      },
      {
        roadmapNodeId: requiredNode.id,
        startedAt: new Date('2026-05-01T00:00:00.000Z'),
        status: NodeStatus.IN_PROGRESS,
        userId: user.id,
      },
      {
        roadmapNodeId: optionalNode.id,
        status: NodeStatus.LOCKED,
        userId: user.id,
      },
      {
        roadmapNodeId: milestoneNode.id,
        status: NodeStatus.LOCKED,
        userId: user.id,
      },
      {
        roadmapNodeId: nextGroupNode.id,
        status: NodeStatus.LOCKED,
        userId: user.id,
      },
      {
        roadmapNodeId: nextRequiredNode.id,
        status: NodeStatus.LOCKED,
        userId: user.id,
      },
    ],
  });

  return {
    groupNodeId: groupNode.id,
    milestoneNodeId: milestoneNode.id,
    nextGroupNodeId: nextGroupNode.id,
    nextRequiredNodeId: nextRequiredNode.id,
    optionalNodeId: optionalNode.id,
    prerequisiteSkillId: prerequisiteSkill.id,
    requiredNodeId: requiredNode.id,
    requiredSkillId: requiredSkill.id,
    roadmapId: roadmap.id,
    user,
  };
}

export async function seedPassedMilestoneSubmission(
  prisma: PrismaService,
  options: { milestoneNodeId: string; userId: string },
): Promise<void> {
  const testResults = Array.from({ length: 6 }, (_value, index) => ({
    name: `Integration test ${index + 1}`,
    passed: true,
    message: `Integration test ${index + 1} passed.`,
  }));
  const testSuite = await prisma.milestoneTestSuite.create({
    data: {
      generatedAt: new Date('2026-05-02T00:00:00.000Z'),
      passThresholdPct: 80,
      roadmapNodeId: options.milestoneNodeId,
      status: MilestoneTestSuiteStatus.READY,
      summary: 'Generated integration test suite',
      testCases: Array.from({ length: 6 }, (_value, index) => ({
        name: `Integration test ${index + 1}`,
        description: `Checks integration milestone requirement ${index + 1}`,
      })),
      testFileContent: `console.log('RMAP_MILESTONE_RESULTS:${JSON.stringify({
        totalTests: 6,
        passedTests: 6,
        tests: testResults,
      })}');`,
      title: 'Integration Milestone Suite',
    },
  });

  await prisma.milestoneSubmission.create({
    data: {
      attemptNumber: 1,
      completedAt: new Date('2026-05-02T00:00:00.000Z'),
      outputLog: 'All tests passed',
      passRatePct: 100,
      passedTests: 6,
      repoUrl: 'https://github.com/example/project',
      roadmapNodeId: options.milestoneNodeId,
      status: MilestoneSubmissionStatus.PASSED,
      testCommand: 'node .rmap/milestone-test.mjs',
      testResults,
      testSuiteId: testSuite.id,
      totalTests: 6,
      userId: options.userId,
    },
  });
}

function assertSafeToResetDatabase(): void {
  const skipReason = getDatabaseSafetySkipReason();

  if (skipReason) throw new Error(`Refusing to reset database: ${skipReason}`);
}

function allowsDatabaseReset(): boolean {
  return (
    process.env.INTEGRATION_ALLOW_DB_RESET === 'true' || process.env.E2E_ALLOW_DB_RESET === 'true'
  );
}
