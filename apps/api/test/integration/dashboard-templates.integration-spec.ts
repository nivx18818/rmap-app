import { MilestoneSubmissionStatus, NodeStatus } from '@repo/db/prisma/client';
import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import { seedRoadmapWorkflow, seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type PublicTemplatesBody = {
  data: Array<{ id: string; isTemplate: boolean; title: string }>;
};

type TemplateNodesBody = {
  nodes: Array<{
    id: string;
    name: string;
    nodeType: string;
    progress?: { status: string } | null;
  }>;
};

type ActivityBody = {
  activity: Array<{ activityDate: string; nodesCompleted: number }>;
};

type StartTemplateBody = {
  roadmap: { id: string; isTemplate: boolean; startedAt: null | string };
  unlockedNodes: string[];
};

type DashboardBody = {
  roadmaps: Array<{ roadmapId: string }>;
};

describe('Learner dashboard and public templates (integration)', () => {
  const integration = setupIntegrationTest();

  it('reads public templates and learner dashboard data', async () => {
    const seeded = await seedRoadmapWorkflow(integration.prisma);

    const templatesResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/templates?roleCategory=web_development')
      .expect(200);
    const templatesBody = templatesResponse.body as PublicTemplatesBody;

    expect(templatesBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: seeded.templateId,
          isTemplate: true,
          title: 'Seeded Template',
        }),
      ]),
    );

    const templateDetailResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/templates/${seeded.templateId}`)
      .expect(200);

    expect(templateDetailResponse.body).toMatchObject({
      id: seeded.templateId,
      title: 'Seeded Template',
    });

    const templateNodesResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/templates/${seeded.templateId}/nodes`)
      .expect(200);
    const templateNodesBody = templateNodesResponse.body as TemplateNodesBody;

    expect(templateNodesBody.nodes).toEqual([
      expect.objectContaining({
        id: seeded.templateNodeId,
        name: 'Template Foundations',
        nodeType: 'GROUP',
      }),
    ]);

    const loginResponse = await integration.loginAs(seeded.user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const dashboardResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/dashboard')
      .set('Cookie', cookie)
      .expect(200);

    expect(dashboardResponse.body).toMatchObject({
      summary: {
        activeRoadmaps: 1,
        completedSkills: 1,
        totalRoadmaps: 1,
        totalSkills: 1,
      },
      userProfile: {
        email: seeded.user.email,
        fullName: 'Learner One',
        id: seeded.user.id,
      },
    });

    const activityResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/users/me/activity?from=2026-05-29&to=2026-05-31')
      .set('Cookie', cookie)
      .expect(200);
    const activityBody = activityResponse.body as ActivityBody;

    expect(activityBody.activity).toEqual([
      { activityDate: '2026-05-29', nodesCompleted: 1 },
      { activityDate: '2026-05-30', nodesCompleted: 2 },
      { activityDate: '2026-05-31', nodesCompleted: 0 },
    ]);

    const startTemplateResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.templateId}/start`)
      .set('Cookie', cookie)
      .expect(200);
    const startTemplateBody = startTemplateResponse.body as StartTemplateBody;

    expect(startTemplateBody).toMatchObject({
      roadmap: { id: seeded.templateId, isTemplate: true },
      unlockedNodes: [seeded.templateNodeId],
    });
    expect(typeof startTemplateBody.roadmap.startedAt).toBe('string');

    const learnerTemplateNodesResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/roadmaps/${seeded.templateId}/nodes`)
      .set('Cookie', cookie)
      .expect(200);
    const learnerTemplateNodesBody = learnerTemplateNodesResponse.body as TemplateNodesBody;
    const learnerTemplateNode = learnerTemplateNodesBody.nodes[0];

    expect(learnerTemplateNode?.id).toBe(seeded.templateNodeId);
    expect(learnerTemplateNode?.progress?.status).toBe('IN_PROGRESS');
  });

  it('deletes only the current learner progress for a template roadmap', async () => {
    const seeded = await seedRoadmapWorkflow(integration.prisma);
    const otherUser = await seedUser(integration.prisma, {
      email: uniqueEmail('template-progress-other-user'),
    });
    await integration.prisma.userNodeProgress.create({
      data: {
        roadmapNodeId: seeded.templateNodeId,
        startedAt: new Date('2026-06-01T00:00:00.000Z'),
        status: NodeStatus.IN_PROGRESS,
        userId: otherUser.id,
      },
    });

    const loginResponse = await integration.loginAs(seeded.user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.templateId}/start`)
      .set('Cookie', cookie)
      .expect(200);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/roadmaps/${seeded.templateId}/progress`)
      .set('Cookie', cookie)
      .expect(204);

    const [template, templateNode, currentUserProgress, otherUserProgress, dailyActivityCount] =
      await Promise.all([
        integration.prisma.roadmap.findUnique({ where: { id: seeded.templateId } }),
        integration.prisma.roadmapNode.findUnique({ where: { id: seeded.templateNodeId } }),
        integration.prisma.userNodeProgress.count({
          where: {
            roadmapNode: { roadmapId: seeded.templateId },
            userId: seeded.user.id,
          },
        }),
        integration.prisma.userNodeProgress.count({
          where: {
            roadmapNode: { roadmapId: seeded.templateId },
            userId: otherUser.id,
          },
        }),
        integration.prisma.dailyActivity.count({ where: { userId: seeded.user.id } }),
      ]);

    expect(template?.isTemplate).toBe(true);
    expect(templateNode?.roadmapId).toBe(seeded.templateId);
    expect(currentUserProgress).toBe(0);
    expect(otherUserProgress).toBe(1);
    expect(dailyActivityCount).toBe(2);

    const dashboardResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/dashboard')
      .set('Cookie', cookie)
      .expect(200);
    const dashboardBody = dashboardResponse.body as DashboardBody;

    expect(dashboardBody.roadmaps.some((roadmap) => roadmap.roadmapId === seeded.templateId)).toBe(
      false,
    );

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/roadmaps/${seeded.templateId}/progress`)
      .set('Cookie', cookie)
      .expect(204);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.templateId}/start`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('rejects progress deletion for a non-template roadmap', async () => {
    const seeded = await seedRoadmapWorkflow(integration.prisma);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/roadmaps/${seeded.templateId}/progress`)
      .expect(401);

    const loginResponse = await integration.loginAs(seeded.user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/roadmaps/${seeded.roadmapId}/progress`)
      .set('Cookie', cookie)
      .expect(404);
  });

  it('rejects progress deletion while a milestone submission is running', async () => {
    const seeded = await seedRoadmapWorkflow(integration.prisma);
    const loginResponse = await integration.loginAs(seeded.user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/roadmaps/${seeded.templateId}/start`)
      .set('Cookie', cookie)
      .expect(200);

    await integration.prisma.milestoneSubmission.create({
      data: {
        repoUrl: 'https://github.com/example/running-template-submission',
        roadmapNodeId: seeded.templateNodeId,
        status: MilestoneSubmissionStatus.RUNNING,
        userId: seeded.user.id,
      },
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/roadmaps/${seeded.templateId}/progress`)
      .set('Cookie', cookie)
      .expect(409);

    const remainingProgress = await integration.prisma.userNodeProgress.count({
      where: {
        roadmapNode: { roadmapId: seeded.templateId },
        userId: seeded.user.id,
      },
    });

    expect(remainingProgress).toBe(1);
  });
});
