import request from 'supertest';

import { setupIntegrationTest } from './utils/integration-test-context';

type GoalsResponseBody = {
  suggestions: Array<{ roleCategory: string }>;
};

describe('Onboarding (integration)', () => {
  const integration = setupIntegrationTest();

  it('completes the public onboarding flow', async () => {
    const goalsResponse = await request(integration.app.getHttpServer())
      .get('/api/v1/onboarding/goals?roleCategory=frontend')
      .expect(200);
    const goalsBody = goalsResponse.body as GoalsResponseBody;

    expect(goalsBody.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          roleCategory: 'Frontend',
        }),
      ]),
    );

    const quizResponse = await request(integration.app.getHttpServer())
      .post('/api/v1/onboarding/quiz')
      .send({ topic: 'I want to build full stack web applications' })
      .expect(201);

    expect(quizResponse.body).toEqual({
      questions: [{ possibleAnswers: ['Web apps'], question: 'What do you want to build?' }],
      roleCategory: 'web-development',
    });
  });
});
