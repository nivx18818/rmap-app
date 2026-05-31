import { RoleCategory, UserRole } from '@repo/db/prisma/client';
import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import { seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

describe('Admin template management (integration)', () => {
  const integration = setupIntegrationTest();

  it('manages a roadmap template through admin routes', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('main-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const templateResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/templates')
      .set('Cookie', cookie)
      .send({
        description: 'Template managed by the main integration flow',
        estimatedWeeks: 10,
        roleCategory: 'web_development',
        title: 'Main Flow Template',
      })
      .expect(201);
    const template = templateResponse.body as { id: string };

    const updateTemplateResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/templates/${template.id}`)
      .set('Cookie', cookie)
      .send({
        description: 'Updated template description',
        estimatedWeeks: 12,
        title: 'Updated Main Flow Template',
      })
      .expect(200);

    expect(updateTemplateResponse.body).toMatchObject({
      description: 'Updated template description',
      estimatedWeeks: 12,
      id: template.id,
      title: 'Updated Main Flow Template',
    });

    const groupResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/templates/${template.id}/nodes`)
      .set('Cookie', cookie)
      .send({
        name: 'Template Group',
        nodeType: 'group',
        posX: 0,
        posY: 0,
      })
      .expect(201);
    const group = groupResponse.body as { id: string };

    const skill = await integration.prisma.skill.create({
      data: {
        defaultEstimatedHours: 5,
        description: 'Template node skill',
        name: `Template Skill ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    const leafResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/templates/${template.id}/nodes`)
      .set('Cookie', cookie)
      .send({
        estimatedHours: 5,
        name: 'Template Required Skill',
        nodeType: 'required',
        parentId: group.id,
        posX: 100,
        posY: 100,
        skillId: skill.id,
      })
      .expect(201);
    const leaf = leafResponse.body as { id: string };

    const updateNodeResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/templates/${template.id}/nodes/${leaf.id}`)
      .set('Cookie', cookie)
      .send({
        estimatedHours: 7,
        name: 'Updated Required Skill',
        posX: 150,
      })
      .expect(200);

    expect(updateNodeResponse.body).toMatchObject({
      estimatedHours: 7,
      id: leaf.id,
      name: 'Updated Required Skill',
      posX: 150,
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/templates/${template.id}/nodes/${group.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/templates/${template.id}`)
      .set('Cookie', cookie)
      .expect(204);
  });
});
