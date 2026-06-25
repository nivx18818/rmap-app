import { NodeType, RoleCategory, UserRole } from '@repo/db/prisma/client';
import request from 'supertest';

import { ErrorCode } from '@/common/constants/error-codes';

import { getCookieHeader } from './utils/cookies';
import { seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type SkillIdBody = {
  id: string;
};

type SkillBody = SkillIdBody & {
  defaultEstimatedHours: null | number;
  description: null | string;
  name: string;
  roleCategory: RoleCategory;
};

type SkillDetailBody = SkillBody & {
  prerequisites: Array<{ name: string; skillId: string }>;
};

type SkillListBody = {
  data: SkillBody[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

type ValidationBody = {
  errors?: Record<string, unknown>;
};

const missingSkillId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const expectAnyArray = (): unknown[] => expect.any(Array) as unknown[];

describe('Admin skill catalog management (integration)', () => {
  const integration = setupIntegrationTest();

  it('rejects unauthenticated and non-admin access to admin skill routes', async () => {
    await request(integration.app.getHttpServer()).get('/api/v1/admin/skills').expect(401);

    const user = await seedUser(integration.prisma, { email: uniqueEmail('skill-user') });
    const loginResponse = await integration.loginAs(user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const forbiddenResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .expect(403);

    expect(forbiddenResponse.body).toMatchObject({
      code: 40300,
      message: 'Access denied',
    });
  });

  it('creates, lists, gets, updates, and deletes skills through admin routes', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const alphaResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        defaultEstimatedHours: 4.5,
        description: '  Learn token-based auth  ',
        name: `  Admin Skill JWT Alpha ${suffix}  `,
        roleCategory: 'web_development',
      })
      .expect(201);
    const alpha = alphaResponse.body as SkillBody;

    expect(alphaResponse.body).toMatchObject({
      defaultEstimatedHours: 4.5,
      description: 'Learn token-based auth',
      name: `Admin Skill JWT Alpha ${suffix}`,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    });

    const betaResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        defaultEstimatedHours: null,
        description: null,
        name: `Admin Skill JWT Beta ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      })
      .expect(201);
    const beta = betaResponse.body as SkillBody;

    await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        name: `Admin Skill Docker ${suffix}`,
        roleCategory: RoleCategory.DEVOPS,
      })
      .expect(201);

    const listResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills')
      .query({
        page: 1,
        perPage: 1,
        q: 'jwt',
        roleCategory: 'web_development',
      })
      .set('Cookie', cookie)
      .expect(200);
    const listBody = listResponse.body as SkillListBody;

    expect(listBody).toMatchObject({
      meta: {
        page: 1,
        perPage: 1,
        total: 2,
        totalPages: 2,
      },
    });
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0]).toMatchObject({
      id: alpha.id,
      name: `Admin Skill JWT Alpha ${suffix}`,
    });

    const betaPrerequisite = await integration.prisma.skill.create({
      data: {
        name: `ZZ Admin Skill Prerequisite ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const alphaPrerequisite = await integration.prisma.skill.create({
      data: {
        name: `AA Admin Skill Prerequisite ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    await integration.prisma.skillPrerequisite.createMany({
      data: [
        {
          prerequisiteSkillId: betaPrerequisite.id,
          skillId: alpha.id,
        },
        {
          prerequisiteSkillId: alphaPrerequisite.id,
          skillId: alpha.id,
        },
      ],
    });

    const detailResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${alpha.id}`)
      .set('Cookie', cookie)
      .expect(200);
    const detailBody = detailResponse.body as SkillDetailBody;

    expect(detailBody).toMatchObject({
      id: alpha.id,
      prerequisites: [
        {
          name: alphaPrerequisite.name,
          skillId: alphaPrerequisite.id,
        },
        {
          name: betaPrerequisite.name,
          skillId: betaPrerequisite.id,
        },
      ],
    });

    const updateResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/skills/${alpha.id}`)
      .set('Cookie', cookie)
      .send({
        defaultEstimatedHours: null,
        description: null,
        name: `Admin Skill JWT Updated ${suffix}`,
        roleCategory: 'devops',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      defaultEstimatedHours: null,
      description: null,
      id: alpha.id,
      name: `Admin Skill JWT Updated ${suffix}`,
      roleCategory: RoleCategory.DEVOPS,
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${beta.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${beta.id}`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${alpha.id}`)
      .set('Cookie', cookie)
      .expect(204);
  });

  it('validates skill payloads, query params, and path params', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-validation-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills/not-a-uuid')
      .set('Cookie', cookie)
      .expect(400);

    await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills')
      .query({ perPage: 101 })
      .set('Cookie', cookie)
      .expect(400);

    const emptyNameResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        name: '   ',
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      })
      .expect(400);
    const emptyNameBody = emptyNameResponse.body as ValidationBody;

    expect(emptyNameBody.errors).toMatchObject({
      name: expectAnyArray(),
    });

    const invalidPayloadResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        defaultEstimatedHours: -1,
        extra: 'not allowed',
        name: 'Invalid Skill',
        roleCategory: 'not-a-category',
      })
      .expect(400);
    const invalidPayloadBody = invalidPayloadResponse.body as ValidationBody;

    expect(invalidPayloadResponse.body).toMatchObject({
      code: 40001,
      message: 'Validation failed',
    });
    expect(invalidPayloadBody.errors).toMatchObject({
      defaultEstimatedHours: expectAnyArray(),
      extra: expectAnyArray(),
      roleCategory: expectAnyArray(),
    });
  });

  it('returns conflict responses for duplicate skill names', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-conflict-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const existing = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Unique ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const other = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Other ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });

    const createConflictResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills')
      .set('Cookie', cookie)
      .send({
        name: existing.name,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      })
      .expect(409);

    expect(createConflictResponse.body).toMatchObject({
      code: ErrorCode.SKILL_NAME_ALREADY_EXISTS,
    });

    const updateConflictResponse = await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/skills/${other.id}`)
      .set('Cookie', cookie)
      .send({
        name: existing.name,
      })
      .expect(409);

    expect(updateConflictResponse.body).toMatchObject({
      code: ErrorCode.SKILL_NAME_ALREADY_EXISTS,
    });
  });

  it('returns not found responses for missing skills', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-missing-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${missingSkillId}`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .put(`/api/v1/admin/skills/${missingSkillId}`)
      .set('Cookie', cookie)
      .send({ name: 'Missing Skill' })
      .expect(404);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${missingSkillId}`)
      .set('Cookie', cookie)
      .expect(404);
  });

  it('blocks deleting skills referenced by roadmap or template nodes', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-reference-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const skill = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Referenced ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const template = await integration.prisma.roadmap.create({
      data: {
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: `Referenced Template ${suffix}`,
      },
    });

    await integration.prisma.roadmapNode.create({
      data: {
        name: `Referenced Skill Node ${suffix}`,
        nodeType: NodeType.REQUIRED,
        posX: 0,
        posY: 0,
        roadmapId: template.id,
        skillId: skill.id,
      },
    });

    const conflictResponse = await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${skill.id}`)
      .set('Cookie', cookie)
      .expect(409);

    expect(conflictResponse.body).toMatchObject({
      code: ErrorCode.SKILL_DELETE_REFERENCED,
    });
  });

  it('bulk updates and bulk deletes skills with per-item results', async () => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail('skill-bulk-admin'),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const first = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Bulk First ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const second = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Bulk Second ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const referenced = await integration.prisma.skill.create({
      data: {
        name: `Admin Skill Bulk Referenced ${suffix}`,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
    });
    const template = await integration.prisma.roadmap.create({
      data: {
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: `Admin Skill Bulk Template ${suffix}`,
      },
    });

    await integration.prisma.roadmapNode.create({
      data: {
        name: `Admin Skill Bulk Referenced Node ${suffix}`,
        nodeType: NodeType.REQUIRED,
        posX: 0,
        posY: 0,
        roadmapId: template.id,
        skillId: referenced.id,
      },
    });

    const categoryResponse = await request(integration.app.getHttpServer())
      .patch('/api/v1/admin/skills/bulk/category')
      .set('Cookie', cookie)
      .send({
        ids: [first.id, missingSkillId],
        roleCategory: 'devops',
      })
      .expect(200);

    expect(categoryResponse.body).toEqual({
      failed: [
        expect.objectContaining({
          code: String(ErrorCode.SKILL_NOT_FOUND),
          id: missingSkillId,
        }),
      ],
      succeeded: [first.id],
    });

    await expect(
      integration.prisma.skill.findUniqueOrThrow({ where: { id: first.id } }),
    ).resolves.toMatchObject({
      roleCategory: RoleCategory.DEVOPS,
    });

    const deleteResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/skills/bulk-delete')
      .set('Cookie', cookie)
      .send({
        ids: [second.id, referenced.id],
      })
      .expect(201);

    expect(deleteResponse.body).toEqual({
      failed: [
        expect.objectContaining({
          code: String(ErrorCode.SKILL_DELETE_REFERENCED),
          id: referenced.id,
        }),
      ],
      succeeded: [second.id],
    });

    await expect(
      integration.prisma.skill.findUnique({ where: { id: second.id } }),
    ).resolves.toBeNull();
    await expect(
      integration.prisma.skill.findUnique({ where: { id: referenced.id } }),
    ).resolves.toMatchObject({ id: referenced.id });
  });
});
