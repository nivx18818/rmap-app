import { ResourceType, RoleCategory, UserRole } from '@repo/db/prisma/client';
import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import { seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type ResourceIdBody = {
  id: number;
};

type ResourceListBody = {
  resources: ResourceIdBody[];
  skillId: string;
};

type ValidationBody = {
  errors?: Record<string, unknown>;
};

const expectAnyArray = (): unknown[] => expect.any(Array) as unknown[];

describe('Admin skill resource management (integration)', () => {
  const integration = setupIntegrationTest();

  it('rejects unauthenticated and non-admin access to admin resource routes', async () => {
    const skill = await integration.prisma.skill.create({
      data: {
        description: 'Admin resource auth skill',
        name: `Admin Resource Auth ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/resources`)
      .expect(401);

    const user = await seedUser(integration.prisma, { email: uniqueEmail('resource-user') });
    const loginResponse = await integration.loginAs(user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const forbiddenResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .expect(403);

    expect(forbiddenResponse.body).toMatchObject({
      code: 40300,
      message: 'Access denied',
    });
  });

  it('manages resources through admin routes', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('resource-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const skill = await integration.prisma.skill.create({
      data: {
        description: 'Admin resource CRUD skill',
        name: `Admin Resource CRUD ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    const articleResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .send({
        resourceType: 'article',
        title: '  Article guide  ',
        url: 'https://example.test/article',
      })
      .expect(201);
    const article = articleResponse.body as ResourceIdBody;

    expect(articleResponse.body).toMatchObject({
      isFree: true,
      isPrimary: false,
      resourceType: ResourceType.ARTICLE,
      skillId: skill.id,
      title: 'Article guide',
      url: 'https://example.test/article',
    });

    const primaryResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .send({
        isFree: false,
        isPrimary: true,
        resourceType: 'docs',
        title: 'Official docs',
        url: 'https://example.test/docs',
      })
      .expect(201);
    const primary = primaryResponse.body as ResourceIdBody;

    const listResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .expect(200);

    const listBody = listResponse.body as ResourceListBody;

    expect(listBody).toMatchObject({
      skillId: skill.id,
    });
    expect(listBody.resources.map((resource) => resource.id)).toEqual([primary.id, article.id]);

    const updateResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/skills/${skill.id}/resources/${article.id}`)
      .set('Cookie', cookie)
      .send({
        isPrimary: true,
        resourceType: 'course',
        title: 'Updated course',
        url: 'https://example.test/course',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: article.id,
      isPrimary: true,
      resourceType: ResourceType.COURSE,
      title: 'Updated course',
      url: 'https://example.test/course',
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${skill.id}/resources/${primary.id}`)
      .set('Cookie', cookie)
      .expect(204);

    const afterDeleteResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .expect(200);

    const afterDeleteBody = afterDeleteResponse.body as ResourceListBody;

    expect(afterDeleteBody.resources.map((resource) => resource.id)).toEqual([article.id]);
  });

  it('validates payloads and path params', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('resource-validation-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const skill = await integration.prisma.skill.create({
      data: {
        description: 'Admin resource validation skill',
        name: `Admin Resource Validation ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills/not-a-uuid/resources')
      .set('Cookie', cookie)
      .expect(400);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${skill.id}/resources/not-an-int`)
      .set('Cookie', cookie)
      .expect(400);

    const validationResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .send({
        isPrimary: 'false',
        resourceType: 'book',
        title: '   ',
        url: 'notaurl',
      })
      .expect(400);

    expect(validationResponse.body).toMatchObject({
      code: 40001,
      message: 'Validation failed',
    });
    const validationBody = validationResponse.body as ValidationBody;

    expect(validationBody.errors).toMatchObject({
      isPrimary: expectAnyArray(),
      resourceType: expectAnyArray(),
      title: expectAnyArray(),
      url: expectAnyArray(),
    });
  });

  it('allows additional primary resources and returns 404 for missing references', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('resource-error-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const skill = await integration.prisma.skill.create({
      data: {
        description: 'Admin resource error skill',
        name: `Admin Resource Error ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const otherSkill = await integration.prisma.skill.create({
      data: {
        description: 'Admin resource other skill',
        name: `Admin Resource Other ${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    await integration.prisma.resource.createMany({
      data: [
        {
          isPrimary: true,
          resourceType: ResourceType.DOCS,
          skillId: skill.id,
          title: 'Primary docs',
          url: 'https://example.test/docs',
        },
        {
          isPrimary: true,
          resourceType: ResourceType.ARTICLE,
          skillId: skill.id,
          title: 'Primary article',
          url: 'https://example.test/article',
        },
      ],
    });
    const otherResource = await integration.prisma.resource.create({
      data: {
        resourceType: ResourceType.COURSE,
        skillId: otherSkill.id,
        title: 'Other course',
        url: 'https://example.test/other-course',
      },
    });

    const thirdPrimaryResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skill.id}/resources`)
      .set('Cookie', cookie)
      .send({
        isPrimary: true,
        resourceType: 'course',
        title: 'Third primary',
        url: 'https://example.test/third',
      })
      .expect(201);

    expect(thirdPrimaryResponse.body).toMatchObject({
      isPrimary: true,
      resourceType: ResourceType.COURSE,
      title: 'Third primary',
    });

    await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills/3fa85f64-5717-4562-b3fc-2c963f66afa6/resources')
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/skills/${skill.id}/resources/${otherResource.id}`)
      .set('Cookie', cookie)
      .send({ title: 'Cross-skill update' })
      .expect(404);
  });
});
