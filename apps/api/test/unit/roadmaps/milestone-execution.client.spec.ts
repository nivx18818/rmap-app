import type { ConfigService } from '@nestjs/config';

import { MilestoneExecutionClient } from '@/modules/roadmaps/milestone-execution.client';

const makeRequest = () => ({
  repoUrl: 'https://github.com/acme/api-project',
  submissionId: 'submission-1',
  testFileContent: 'console.log("test");',
  timeoutMs: 120_000,
});

describe('MilestoneExecutionClient', () => {
  let configService: jest.Mocked<ConfigService>;
  let client: MilestoneExecutionClient;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'EVALUATOR_URL') return 'http://evaluator.internal';
        if (key === 'EVALUATOR_SHARED_SECRET') return 'shared-secret';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;
    fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    global.fetch = fetchMock;
    client = new MilestoneExecutionClient(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should sign and send execution requests to the runner', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          outputLog: 'ok',
          passRatePct: 100,
          passedTests: 6,
          status: 'PASSED',
          testResults: [],
          totalTests: 6,
        }),
        { status: 200 },
      ),
    );

    const result = await client.execute(makeRequest());

    const [url, init] = fetchMock.mock.calls[0]!;
    const headers = init?.headers as Record<string, string>;

    expect(url).toEqual(new URL('/internal/evaluator/execute', 'http://evaluator.internal'));
    expect(init?.method).toBe('POST');
    expect(headers['content-type']).toBe('application/json');
    expect(typeof headers['x-rmap-signature']).toBe('string');
    expect(typeof headers['x-rmap-timestamp']).toBe('string');
    expect(result.status).toBe('PASSED');
  });

  it('should return error when the evaluator URL is missing', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'EVALUATOR_SHARED_SECRET' ? 'shared-secret' : undefined,
    );

    const result = await client.execute(makeRequest());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      outputLog: '\n[error]\nEvaluator is not configured.\n',
      status: 'ERROR',
    });
  });

  it('should return error when the evaluator is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const result = await client.execute(makeRequest());

    expect(result).toMatchObject({
      outputLog: '\n[error]\nEvaluator is unavailable.\n',
      status: 'ERROR',
    });
  });

  it('should return error when the evaluator response is malformed', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'PASSED',
        }),
        { status: 200 },
      ),
    );

    const result = await client.execute(makeRequest());

    expect(result).toMatchObject({
      outputLog: '\n[error]\nEvaluator returned a malformed result.\n',
      status: 'ERROR',
    });
  });
});
