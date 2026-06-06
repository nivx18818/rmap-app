import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { CommandRunnerService } from '@/evaluator/command-runner.service';

import { EvaluatorService } from '@/evaluator/evaluator.service';

const makeDto = () => ({
  repoUrl: 'https://github.com/acme/api-project',
  submissionId: 'submission-1',
  testFileContent: 'console.log("test");',
  timeoutMs: 120_000,
});

const makeTests = (passedCount = 6) =>
  Array.from({ length: 6 }, (_, index) => ({
    message: index < passedCount ? 'ok' : 'not ok',
    name: `Generated milestone test ${index + 1}`,
    passed: index < passedCount,
  }));

const makeMarker = (passedCount = 6) =>
  `RMAP_MILESTONE_RESULTS:${JSON.stringify({
    passedTests: passedCount,
    tests: makeTests(passedCount),
    totalTests: 6,
  })}`;

describe('EvaluatorService', () => {
  let runCommand: jest.MockedFunction<CommandRunnerService['run']>;
  let service: EvaluatorService;
  let clonedAppPath: string | null;

  beforeEach(() => {
    clonedAppPath = null;
    runCommand = jest.fn<
      ReturnType<CommandRunnerService['run']>,
      Parameters<CommandRunnerService['run']>
    >();
    service = new EvaluatorService({ run: runCommand });
  });

  it('should use npm ci when a package lock exists', async () => {
    runCommand.mockImplementation(async (command, _args, options) => {
      if (command === 'git') {
        clonedAppPath = join(options.cwd!, 'app');
        await mkdir(clonedAppPath, { recursive: true });
        await writeFile(join(clonedAppPath, 'package-lock.json'), '{}', 'utf8');
        return { exitCode: 0, output: 'cloned', timedOut: false };
      }

      if (command === 'npm') {
        return { exitCode: 0, output: 'installed', timedOut: false };
      }

      return { exitCode: 0, output: makeMarker(6), timedOut: false };
    });

    const result = await service.execute(makeDto());

    const npmCall = runCommand.mock.calls.find(([command]) => command === 'npm');

    expect(npmCall).toBeDefined();
    expect(npmCall?.[1]).toEqual(['ci']);
    expect(typeof npmCall?.[2].timeoutMs).toBe('number');
    expect(result.status).toBe('PASSED');
    await expect(access(clonedAppPath!)).rejects.toThrow();
  });

  it('should use npm install when no package lock exists', async () => {
    runCommand.mockImplementation(async (command, _args, options) => {
      if (command === 'git') {
        clonedAppPath = join(options.cwd!, 'app');
        await mkdir(clonedAppPath, { recursive: true });
      }

      return {
        exitCode: 0,
        output: command === 'node' ? makeMarker(6) : 'ok',
        timedOut: false,
      };
    });

    await service.execute(makeDto());

    const npmCall = runCommand.mock.calls.find(([command]) => command === 'npm');

    expect(npmCall).toBeDefined();
    expect(npmCall?.[1]).toEqual(['install']);
    expect(typeof npmCall?.[2].timeoutMs).toBe('number');
  });

  it('should parse valid milestone result output', async () => {
    runCommand.mockImplementation(async (command, _args, options) => {
      if (command === 'git') {
        await mkdir(join(options.cwd!, 'app'), { recursive: true });
      }

      return {
        exitCode: 0,
        output: command === 'node' ? `logs\n${makeMarker(5)}\n` : 'ok',
        timedOut: false,
      };
    });

    const result = await service.execute(makeDto());

    expect(result).toMatchObject({
      passedTests: 5,
      passRatePct: 83.33,
      status: 'PASSED',
      totalTests: 6,
    });
    expect(result.testResults).toHaveLength(6);
  });

  it('should return failed when pass rate is below threshold', async () => {
    runCommand.mockImplementation(async (command, _args, options) => {
      if (command === 'git') {
        await mkdir(join(options.cwd!, 'app'), { recursive: true });
      }

      return {
        exitCode: 0,
        output: command === 'node' ? makeMarker(4) : 'ok',
        timedOut: false,
      };
    });

    const result = await service.execute(makeDto());

    expect(result.status).toBe('FAILED');
    expect(result.passRatePct).toBe(66.67);
  });

  it('should return error for missing result marker', async () => {
    runCommand.mockImplementation(async (command, _args, options) => {
      if (command === 'git') {
        await mkdir(join(options.cwd!, 'app'), { recursive: true });
      }

      return {
        exitCode: 0,
        output: command === 'node' ? 'no marker here' : 'ok',
        timedOut: false,
      };
    });

    const result = await service.execute(makeDto());

    expect(result.status).toBe('ERROR');
    expect(result.outputLog).toContain('Generated tests did not emit structured RMap results.');
  });

  it('should sanitize ANSI output and truncate logs', async () => {
    runCommand.mockResolvedValue({
      exitCode: 1,
      output: `\u001b[31m${'x'.repeat(25_000)}`,
      timedOut: false,
    });

    const result = await service.execute(makeDto());

    expect(result.status).toBe('ERROR');
    expect(result.outputLog).not.toContain('\u001b[31m');
    expect(result.outputLog).toHaveLength(20_000);
  });
});
