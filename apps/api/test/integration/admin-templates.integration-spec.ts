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

    const listTemplatesResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/admin/templates')
      .query({ q: 'Main Flow Template', roleCategory: 'web_development' })
      .set('Cookie', cookie)
      .expect(200);
    const listTemplatesBody = listTemplatesResponse.body as {
      data: Array<{ id: string; title: string }>;
      meta: { total: number };
    };

    expect(listTemplatesBody.data).toHaveLength(1);
    expect(listTemplatesBody.data[0]).toMatchObject({
      id: template.id,
      title: 'Main Flow Template',
    });
    expect(listTemplatesBody.meta.total).toBe(1);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/templates/${template.id}`)
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => {
        const body = response.body as { id: string; title: string };

        expect(body).toMatchObject({
          id: template.id,
          title: 'Main Flow Template',
        });
      });

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
      })
      .expect(201);
    const group = groupResponse.body as { id: string; posX: number; posY: number };

    expect(group.posX).toEqual(expect.any(Number));
    expect(group.posY).toEqual(expect.any(Number));

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
        skillId: skill.id,
      })
      .expect(201);
    const leaf = leafResponse.body as { id: string; posX: number; posY: number };

    expect(leaf.posX).toEqual(expect.any(Number));
    expect(leaf.posY).toEqual(expect.any(Number));

    const listNodesResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/templates/${template.id}/nodes`)
      .set('Cookie', cookie)
      .expect(200);
    const listNodesBody = listNodesResponse.body as {
      nodes: Array<{ id: string; parentId: null | string; posX: number; posY: number }>;
    };

    expect(listNodesBody.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: group.id,
          parentId: null,
          posX: expect.any(Number) as number,
          posY: expect.any(Number) as number,
        }),
        expect.objectContaining({
          id: leaf.id,
          parentId: group.id,
          posX: expect.any(Number) as number,
          posY: expect.any(Number) as number,
        }),
      ]),
    );

    const updateNodeResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/templates/${template.id}/nodes/${leaf.id}`)
      .set('Cookie', cookie)
      .send({
        estimatedHours: 7,
        name: 'Updated Required Skill',
      })
      .expect(200);

    expect(updateNodeResponse.body).toMatchObject({
      estimatedHours: 7,
      id: leaf.id,
      name: 'Updated Required Skill',
      posX: expect.any(Number) as number,
      posY: expect.any(Number) as number,
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/templates/${template.id}/nodes/${group.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/templates/${template.id}/nodes`)
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => {
        const body = response.body as { nodes: unknown[] };

        expect(body.nodes).toHaveLength(0);
      });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/templates/${template.id}`)
      .set('Cookie', cookie)
      .expect(204);
  });
});
