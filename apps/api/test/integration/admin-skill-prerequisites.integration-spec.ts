import { RoleCategory, UserRole } from '@repo/db/prisma/client';
import request from 'supertest';

import type { PrismaService } from '@/modules/prisma/prisma.service';

import { ErrorCode } from '@/common/constants/error-codes';

import { getCookieHeader } from './utils/cookies';
import { seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type SkillBody = {
  createdAt: string;
  defaultEstimatedHours: null | number;
  description: null | string;
  id: string;
  name: string;
  roleCategory: null | RoleCategory;
  updatedAt: string;
};

type SkillPrerequisiteListBody = {
  prerequisites: SkillBody[];
  skillId: string;
};

type ValidationBody = {
  errors?: Record<string, unknown>;
};

const missingSkillId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const expectAnyArray = (): unknown[] => expect.any(Array) as unknown[];

const uniqueName = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2)}`;

const seedSkill = async (
  prisma: PrismaService,
  prefix: string,
  data: {
    defaultEstimatedHours?: number;
    description?: null | string;
    roleCategory?: RoleCategory;
  } = {},
) =>
  await prisma.skill.create({
    data: {
      defaultEstimatedHours: data.defaultEstimatedHours,
      description: Object.hasOwn(data, 'description') ? data.description : `${prefix} description`,
      name: uniqueName(prefix),
      roleCategory: data.roleCategory ?? RoleCategory.WEB_DEVELOPMENT,
    },
  });

describe('Admin skill prerequisite management (integration)', () => {
  const integration = setupIntegrationTest();

  const loginAdmin = async (prefix: string): Promise<string> => {
    const admin = await seedUser(integration.prisma, {
      email: uniqueEmail(prefix),
      role: UserRole.ADMIN,
    });
    const loginResponse = await integration.loginAs(admin.email);

    return getCookieHeader(loginResponse, ['access_token']);
  };

  it('rejects unauthenticated and non-admin access to admin prerequisite routes', async () => {
    const skill = await seedSkill(integration.prisma, 'Admin Prerequisite Auth Skill');

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/prerequisites`)
      .expect(401);

    const user = await seedUser(integration.prisma, {
      email: uniqueEmail('prerequisite-user'),
    });
    const loginResponse = await integration.loginAs(user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const forbiddenResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${skill.id}/prerequisites`)
      .set('Cookie', cookie)
      .expect(403);

    expect(forbiddenResponse.body).toMatchObject({
      code: 40300,
      message: 'Access denied',
    });
  });

  it('validates prerequisite path and body UUID values', async () => {
    const cookie = await loginAdmin('prerequisite-validation-admin');
    const skill = await seedSkill(integration.prisma, 'Admin Prerequisite Validation Skill');

    await request(integration.app.getHttpServer())
      .get('/api/v1/admin/skills/not-a-uuid/prerequisites')
      .set('Cookie', cookie)
      .expect(400);

    const bodyValidationResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skill.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: 'not-a-uuid' })
      .expect(400);
    const bodyValidation = bodyValidationResponse.body as ValidationBody;

    expect(bodyValidation.errors).toMatchObject({
      prerequisiteSkillId: expectAnyArray(),
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${skill.id}/prerequisites/not-a-uuid`)
      .set('Cookie', cookie)
      .expect(400);
  });

  it('adds, lists, rejects duplicate, and deletes prerequisites through admin routes', async () => {
    const cookie = await loginAdmin('prerequisite-crud-admin');
    const target = await seedSkill(integration.prisma, 'Admin Prerequisite Target', {
      description: 'Target skill',
    });
    const betaPrereq = await seedSkill(integration.prisma, 'ZZ Admin Prerequisite Beta', {
      defaultEstimatedHours: 4.5,
      description: 'Beta prerequisite',
      roleCategory: RoleCategory.FRAMEWORKS,
    });
    const alphaPrereq = await seedSkill(integration.prisma, 'AA Admin Prerequisite Alpha', {
      defaultEstimatedHours: 2,
      description: null,
      roleCategory: RoleCategory.DEVOPS,
    });

    await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${target.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: betaPrereq.id })
      .expect(201);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${target.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: alphaPrereq.id })
      .expect(201);

    const listResponse = await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${target.id}/prerequisites`)
      .set('Cookie', cookie)
      .expect(200);
    const listBody = listResponse.body as SkillPrerequisiteListBody;

    expect(listBody).toMatchObject({
      prerequisites: [
        {
          defaultEstimatedHours: 2,
          description: null,
          id: alphaPrereq.id,
          name: alphaPrereq.name,
          roleCategory: RoleCategory.DEVOPS,
        },
        {
          defaultEstimatedHours: 4.5,
          description: 'Beta prerequisite',
          id: betaPrereq.id,
          name: betaPrereq.name,
          roleCategory: RoleCategory.FRAMEWORKS,
        },
      ],
      skillId: target.id,
    });
    expect(listBody.prerequisites[0]?.createdAt).toEqual(expect.any(String));
    expect(listBody.prerequisites[0]?.updatedAt).toEqual(expect.any(String));

    const duplicateResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${target.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: betaPrereq.id })
      .expect(409);

    expect(duplicateResponse.body).toMatchObject({
      code: ErrorCode.SKILL_PREREQUISITE_ALREADY_EXISTS,
    });

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${target.id}/prerequisites/${betaPrereq.id}`)
      .set('Cookie', cookie)
      .expect(204);

    const missingEdgeResponse = await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${target.id}/prerequisites/${betaPrereq.id}`)
      .set('Cookie', cookie)
      .expect(404);

    expect(missingEdgeResponse.body).toMatchObject({
      code: ErrorCode.SKILL_PREREQUISITE_NOT_FOUND,
    });
  });

  it('rejects self and transitive prerequisite cycles', async () => {
    const cookie = await loginAdmin('prerequisite-cycle-admin');
    const skillA = await seedSkill(integration.prisma, 'Admin Cycle A');
    const skillB = await seedSkill(integration.prisma, 'Admin Cycle B');
    const skillC = await seedSkill(integration.prisma, 'Admin Cycle C');

    const selfResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skillA.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: skillA.id })
      .expect(409);

    expect(selfResponse.body).toMatchObject({
      code: ErrorCode.SKILL_PREREQUISITE_SELF_REFERENCE,
    });

    await integration.prisma.skillPrerequisite.createMany({
      data: [
        {
          prerequisiteSkillId: skillC.id,
          skillId: skillB.id,
        },
        {
          prerequisiteSkillId: skillA.id,
          skillId: skillC.id,
        },
      ],
    });

    const transitiveResponse = await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${skillA.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: skillB.id })
      .expect(409);

    expect(transitiveResponse.body).toMatchObject({
      code: ErrorCode.SKILL_PREREQUISITE_CYCLE,
    });
  });

  it('returns not found responses for missing target and prerequisite skills', async () => {
    const cookie = await loginAdmin('prerequisite-missing-admin');
    const target = await seedSkill(integration.prisma, 'Admin Missing Target');
    const prerequisite = await seedSkill(integration.prisma, 'Admin Missing Prerequisite');

    await request(integration.app.getHttpServer())
      .get(`/api/v1/admin/skills/${missingSkillId}/prerequisites`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${missingSkillId}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: prerequisite.id })
      .expect(404);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${missingSkillId}/prerequisites/${prerequisite.id}`)
      .set('Cookie', cookie)
      .expect(404);

    await request(integration.app.getHttpServer())
      .post(`/api/v1/admin/skills/${target.id}/prerequisites`)
      .set('Cookie', cookie)
      .send({ prerequisiteSkillId: missingSkillId })
      .expect(404);

    await request(integration.app.getHttpServer())
      .delete(`/api/v1/admin/skills/${target.id}/prerequisites/${missingSkillId}`)
      .set('Cookie', cookie)
      .expect(404);
  });
});
