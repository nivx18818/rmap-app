import { NodeStatus, RoleCategory } from '@repo/db/prisma/client';
import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import {
  seedPassedMilestoneSubmission,
  seedRoadmapLearningGraph,
  seedUser,
  uniqueEmail,
} from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type RoadmapsBody = {
  data: Array<{ id: string; title: string }>;
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

type TemplateNodesBody = {
  nodes: Array<{
    id: string;
    name: string;
    nodeType: string;
    progress?: { status: string } | null;
  }>;
};

type QuizBody = {
  questions: Array<{ correctOption?: string; id: string }>;
};

type QuizSubmitBody = {
  unlockedNodes: string[];
};

type GenerateRoadmapBody = {
  roadmap: { id: string; title: string };
};

type NodeDetailBody = {
  latestSubmission: null | { repoUrl: string; status: string };
  node: {
    id: string;
    progress: { status: string } | null;
  };
  prerequisites: Array<{ skillId: string }>;
  resources: Array<{ title: string }> | null;
  skill: { id: string } | null;
};

describe('Roadmap learning (integration)', () => {
  const integration = setupIntegrationTest();

  it('reads roadmap nodes, progress, node detail, and milestone submission state', async () => {
    const seeded = await seedRoadmapLearningGraph(integration.prisma);
    await seedPassedMilestoneSubmission(integration.prisma, {
      milestoneNodeId: seeded.milestoneNodeId,
      userId: seeded.user.id,
    });
    const loginResponse = await integration.loginAs(seeded.user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const roadmapsResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/roadmaps')
      .set('Cookie', cookie)
      .expect(200);
    const roadmapsBody = roadmapsResponse.body as RoadmapsBody;

    expect(roadmapsBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: seeded.roadmapId,
          title: 'Seeded Roadmap Graph',
        }),
      ]),
    );
    expect(roadmapsBody.meta.total).toBe(1);

    const startResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.roadmapId}/start`)
      .set('Cookie', cookie)
      .expect(200);

    expect(startResponse.body).toMatchObject({
      roadmap: { id: seeded.roadmapId },
      unlockedNodes: [],
    });

    const nodesResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${seeded.roadmapId}/nodes`)
      .set('Cookie', cookie)
      .expect(200);
    const nodesBody = nodesResponse.body as TemplateNodesBody;
    const requiredNode = nodesBody.nodes.find((node) => node.id === seeded.requiredNodeId);
    const milestoneNode = nodesBody.nodes.find((node) => node.id === seeded.milestoneNodeId);

    expect(requiredNode).toMatchObject({
      id: seeded.requiredNodeId,
      nodeType: 'REQUIRED',
      progress: { status: 'IN_PROGRESS' },
    });
    expect(milestoneNode).toMatchObject({
      id: seeded.milestoneNodeId,
      nodeType: 'MILESTONE',
      progress: { status: 'LOCKED' },
    });

    const detailResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${seeded.roadmapId}/nodes/${seeded.requiredNodeId}`)
      .set('Cookie', cookie)
      .expect(200);
    const detailBody = detailResponse.body as NodeDetailBody;

    expect(detailBody).toMatchObject({
      node: {
        id: seeded.requiredNodeId,
        progress: { status: 'IN_PROGRESS' },
      },
      skill: { id: seeded.requiredSkillId },
    });
    expect(detailBody.prerequisites).toEqual(
      expect.arrayContaining([expect.objectContaining({ skillId: seeded.prerequisiteSkillId })]),
    );
    expect(detailBody.resources).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'HTTP API Docs' })]),
    );

    const progressResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${seeded.roadmapId}/progress`)
      .set('Cookie', cookie)
      .expect(200);

    expect(progressResponse.body).toMatchObject({
      nodesCompleted: 0,
      nodesTotal: 6,
      roadmapId: seeded.roadmapId,
    });

    const latestSubmissionResponse = await request(integration.app.getHttpServer())
      .get(
        `/api/v1/roadmaps/${seeded.roadmapId}/nodes/` +
          `${seeded.milestoneNodeId}/milestone-submissions/latest`,
      )
      .set('Cookie', cookie)
      .expect(200);

    expect(latestSubmissionResponse.body).toMatchObject({
      submission: {
        repoUrl: 'https://github.com/example/project',
        status: 'PASSED',
      },
    });
  });

  it('prevents users from reading another learner roadmap', async () => {
    const ownerRoadmap = await seedRoadmapLearningGraph(integration.prisma);
    const otherUser = await seedUser(integration.prisma, {
      email: uniqueEmail('main-owner-check'),
    });
    const loginResponse = await integration.loginAs(otherUser.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${ownerRoadmap.roadmapId}`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${ownerRoadmap.roadmapId}/progress`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .patch(
        `/api/v1/roadmaps/${ownerRoadmap.roadmapId}/nodes/` +
          `${ownerRoadmap.requiredNodeId}/progress`,
      )
      .set('Cookie', cookie)
      .send({ status: 'COMPLETED' })
      .expect(404);
  });

  it('generates a roadmap and completes the first learning step', async () => {
    const user = await seedUser(integration.prisma, { email: uniqueEmail('main-roadmap') });
    await integration.prisma.skill.createMany({
      data: [
        {
          defaultEstimatedHours: 5,
          description: 'Generated HTTP skill',
          name: `Generated HTTP ${Date.now()}-${Math.random().toString(16).slice(2)}`,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
        },
        {
          defaultEstimatedHours: 3,
          description: 'Generated API testing skill',
          name: `Generated API Testing ${Date.now()}-${Math.random().toString(16).slice(2)}`,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
        },
      ],
    });
    const loginResponse = await integration.loginAs(user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const generateResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/roadmaps/generate')
      .set('Cookie', cookie)
      .send({
        deadlineDate: '2026-12-31',
        goal: 'Become confident shipping backend APIs',
        hoursPerDay: 2,
        quizAnswers: Array.from({ length: 7 }, (_value, index) => ({
          answer: `Answer ${index + 1}`,
          question: `Question ${index + 1}`,
        })),
        roleCategory: 'WEB_DEVELOPMENT',
      })
      .expect(201);
    const generateBody = generateResponse.body as GenerateRoadmapBody;
    const generatedRoadmap = generateBody.roadmap;

    expect(generatedRoadmap).toMatchObject({
      title: 'Generated Integration Roadmap',
    });

    await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${generatedRoadmap.id}`)
      .set('Cookie', cookie)
      .expect(200);

    const seeded = await seedRoadmapLearningGraph(integration.prisma);
    const seededLoginResponse = await integration.loginAs(seeded.user.email);
    const seededCookie = getCookieHeader(seededLoginResponse, ['access_token']);

    const quizResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${seeded.roadmapId}/nodes/${seeded.requiredNodeId}/quiz`)
      .set('Cookie', seededCookie)
      .expect(200);
    const quizBody = quizResponse.body as QuizBody;

    expect(quizBody.questions).toHaveLength(5);
    expect(quizBody.questions[0]?.correctOption).toBeUndefined();

    const submitResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.roadmapId}/nodes/${seeded.requiredNodeId}/quiz/submit`)
      .set('Cookie', seededCookie)
      .send({
        answers: quizBody.questions.map((question) => ({
          questionId: question.id,
          selectedOption: 'A',
        })),
      })
      .expect(200);
    const submitBody = submitResponse.body as QuizSubmitBody;

    expect(submitResponse.body).toMatchObject({
      correctCount: 5,
      nodeProgress: {
        roadmapNodeId: seeded.requiredNodeId,
        status: 'COMPLETED',
      },
      passed: true,
      scorePct: 100,
      totalQuestions: 5,
    });
    expect(submitBody.unlockedNodes).toEqual(
      expect.arrayContaining([seeded.optionalNodeId, seeded.milestoneNodeId]),
    );

    const unlockedProgress = await integration.prisma.userNodeProgress.findMany({
      where: {
        roadmapNodeId: {
          in: [seeded.optionalNodeId, seeded.milestoneNodeId],
        },
        userId: seeded.user.id,
      },
      select: {
        roadmapNodeId: true,
        status: true,
      },
    });
    const unlockedProgressByNodeId = new Map(
      unlockedProgress.map((progress) => [progress.roadmapNodeId, progress.status]),
    );

    expect(unlockedProgress).toHaveLength(2);
    expect(unlockedProgressByNodeId).toEqual(
      new Map([
        [seeded.optionalNodeId, NodeStatus.IN_PROGRESS],
        [seeded.milestoneNodeId, NodeStatus.IN_PROGRESS],
      ]),
    );
  });
});
