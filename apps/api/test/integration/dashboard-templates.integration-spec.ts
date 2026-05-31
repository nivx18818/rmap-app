import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import { seedRoadmapWorkflow } from './utils/database';
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
  });
});
