import request from 'supertest';

import { getCookieHeader } from './utils/cookies';
import { seedUser, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type ErrorResponseBody = {
  code: number;
  errors?: Record<string, Array<{ code: string; message: string }>>;
  message: string;
};

describe('Access control and validation (integration)', () => {
  const integration = setupIntegrationTest();

  it('rejects unauthenticated and non-admin access to protected routes', async () => {
    await request(integration.app.getHttpServer()).get('/api/v1/dashboard').expect(401);

    const user = await seedUser(integration.prisma, { email: uniqueEmail('main-access') });
    const loginResponse = await integration.loginAs(user.email);
    const cookie = getCookieHeader(loginResponse, ['access_token']);

    const forbiddenResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/admin/templates')
      .set('Cookie', cookie)
      .send({
        description: 'User should not be able to create this template',
        estimatedWeeks: 4,
        roleCategory: 'web_development',
        title: 'Forbidden Template',
      })
      .expect(403);

    expect(forbiddenResponse.body).toMatchObject({
      code: 40300,
      message: 'Access denied',
    });
  });

  it('returns the configured validation error shape for malformed payloads', async () => {
    const validationResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        fullName: '',
        password: 'short',
        unexpectedField: 'not allowed',
      })
      .expect(400);
    const body = validationResponse.body as ErrorResponseBody;

    expect(body).toMatchObject({
      code: 40001,
      message: 'Validation failed',
    });
    expect(body.errors?.email).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EMAIL_FORMAT_INVALID' })]),
    );
    expect(body.errors?.fullName).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'VALUE_REQUIRED' })]),
    );
    expect(body.errors?.password).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'STRING_TYPE_MIN_LENGTH' })]),
    );
    expect(body.errors?.unexpectedField).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'PROPERTY_NOT_ALLOWED' })]),
    );
  });
});
