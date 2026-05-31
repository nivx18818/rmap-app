import request from 'supertest';

import { getCookieHeader, getSetCookie } from './utils/cookies';
import { INTEGRATION_PASSWORD, uniqueEmail } from './utils/database';
import { setupIntegrationTest } from './utils/integration-test-context';

type RegisterResponseBody = {
  email: string;
  fullName: string;
  passwordHash?: string;
  role: string;
};

describe('Auth session (integration)', () => {
  const integration = setupIntegrationTest();

  it('completes the user authentication session flow', async () => {
    const email = uniqueEmail('main-auth');

    const registerResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        fullName: 'Main Flow User',
        password: INTEGRATION_PASSWORD,
      })
      .expect(201);
    const registerBody = registerResponse.body as RegisterResponseBody;

    expect(registerBody).toMatchObject({
      email,
      fullName: 'Main Flow User',
      role: 'USER',
    });
    expect(registerBody.passwordHash).toBeUndefined();

    const loginResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: INTEGRATION_PASSWORD })
      .expect(200);

    expect(loginResponse.body).toEqual({ message: 'Login successful' });
    expect(getSetCookie(loginResponse, 'access_token')).toContain('HttpOnly');
    expect(getSetCookie(loginResponse, 'refresh_token')).toContain('HttpOnly');

    const profileResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', getCookieHeader(loginResponse, ['access_token']))
      .expect(200);

    expect(profileResponse.body).toMatchObject({
      email,
      fullName: 'Main Flow User',
      role: 'user',
    });

    const refreshResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', getCookieHeader(loginResponse, ['refresh_token']))
      .expect(200);

    expect(refreshResponse.body).toEqual({ message: 'Token refreshed' });

    const logoutResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', getCookieHeader(refreshResponse, ['access_token', 'refresh_token']))
      .expect(200);

    expect(logoutResponse.body).toEqual({ message: 'Logged out successfully' });
  });
});
