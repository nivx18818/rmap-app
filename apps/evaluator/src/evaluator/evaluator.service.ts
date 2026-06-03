import { Injectable, Logger } from '@nestjs/common';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ExecuteEvaluatorDto } from './dto/execute-evaluator.dto';
import type { CommandResult, EvaluatorResponse, MilestoneTestResult } from './types';

import { CommandRunnerService } from './command-runner.service';

const MILESTONE_RESULT_MARKER = 'RMAP_MILESTONE_RESULTS:';
const MILESTONE_TEST_FILE_DIRECTORY = '.rmap';
const MILESTONE_TEST_FILE_NAME = 'milestone-test.mjs';
const MILESTONE_TEST_FILE_RELATIVE_PATH = `${MILESTONE_TEST_FILE_DIRECTORY}/${MILESTONE_TEST_FILE_NAME}`;
const MILESTONE_TEST_RESULT_MESSAGE_LIMIT = 1_000;
const MILESTONE_TEST_RESULT_NAME_LIMIT = 200;
const MILESTONE_TEST_SUITE_CASE_COUNT = 6;
const MILESTONE_OUTPUT_LOG_LIMIT = 20_000;
const DEFAULT_PASS_THRESHOLD_PCT = 80;
const ESCAPE_CHARACTER = String.fromCharCode(27);
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${ESCAPE_CHARACTER}(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])`,
  'g',
);

@Injectable()
export class EvaluatorService {
  private readonly logger = new Logger(EvaluatorService.name);

  constructor(private readonly commandRunner: CommandRunnerService) {}

  async execute(dto: ExecuteEvaluatorDto): Promise<EvaluatorResponse> {
    const startedAt = Date.now();
    const workspacePath = await mkdtemp(join(tmpdir(), 'rmap-milestone-'));
    const appPath = join(workspacePath, 'app');
    let outputLog = '';

    try {
      const cloneResult = await this.runCommand(
        'git',
        ['clone', '--depth', '1', dto.repoUrl, appPath],
        workspacePath,
        startedAt,
        dto.timeoutMs,
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('clone', cloneResult));

      if (cloneResult.timedOut || cloneResult.exitCode !== 0) {
        return this.error(outputLog);
      }

      const installArgs = (await this.hasPackageLock(appPath)) ? ['ci'] : ['install'];
      const installResult = await this.runCommand(
        'npm',
        installArgs,
        appPath,
        startedAt,
        dto.timeoutMs,
      );
      outputLog = this.appendOutputLog(
        outputLog,
        this.formatStageOutput(`npm ${installArgs[0]}`, installResult),
      );

      if (installResult.timedOut || installResult.exitCode !== 0) {
        return this.error(outputLog);
      }

      await this.writeMilestoneTestFile(appPath, dto.testFileContent);
      outputLog = this.appendOutputLog(
        outputLog,
        `\n[inject: ok]\nWrote generated test suite to ${MILESTONE_TEST_FILE_RELATIVE_PATH}\n`,
      );

      const testResult = await this.runCommand(
        'node',
        [MILESTONE_TEST_FILE_RELATIVE_PATH],
        appPath,
        startedAt,
        dto.timeoutMs,
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('test', testResult));

      if (testResult.timedOut || testResult.exitCode === null) {
        return this.error(outputLog);
      }

      const parsedTestResult = this.parseMilestoneTestResult(testResult.output);

      if (!parsedTestResult) {
        outputLog = this.appendOutputLog(
          outputLog,
          '\n[result]\nGenerated tests did not emit structured RMap results.\n',
        );
        return this.error(outputLog);
      }

      const status =
        parsedTestResult.passRatePct >= DEFAULT_PASS_THRESHOLD_PCT ? 'PASSED' : 'FAILED';
      outputLog = this.appendOutputLog(
        outputLog,
        this.formatMilestoneTestResultSummary(parsedTestResult, DEFAULT_PASS_THRESHOLD_PCT),
      );

      return {
        outputLog,
        passRatePct: parsedTestResult.passRatePct,
        passedTests: parsedTestResult.passedTests,
        status,
        testResults: parsedTestResult.testResults,
        totalTests: parsedTestResult.totalTests,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown evaluator error';
      this.logger.error(`Evaluator execution failed: ${dto.submissionId}`, error);
      return this.error(this.appendOutputLog(outputLog, `\n[error]\n${message}\n`));
    } finally {
      await rm(workspacePath, { force: true, recursive: true });
    }
  }

  private async runCommand(
    command: string,
    args: string[],
    cwd: string,
    startedAt: number,
    timeoutMs: number,
  ): Promise<CommandResult> {
    return this.commandRunner.run(command, args, {
      cwd,
      timeoutMs: Math.max(1, timeoutMs - (Date.now() - startedAt)),
    });
  }

  private async hasPackageLock(appPath: string): Promise<boolean> {
    try {
      await access(join(appPath, 'package-lock.json'));
      return true;
    } catch {
      return false;
    }
  }

  private async writeMilestoneTestFile(appPath: string, testFileContent: string): Promise<void> {
    const testDirectoryPath = join(appPath, MILESTONE_TEST_FILE_DIRECTORY);
    await mkdir(testDirectoryPath, { recursive: true });
    await writeFile(join(testDirectoryPath, MILESTONE_TEST_FILE_NAME), testFileContent, 'utf8');
  }

  private error(outputLog: string): EvaluatorResponse {
    return {
      outputLog: this.sanitizeMilestoneOutputLog(outputLog),
      passRatePct: null,
      passedTests: null,
      status: 'ERROR',
      testResults: null,
      totalTests: null,
    };
  }

  private formatStageOutput(stage: string, result: CommandResult): string {
    const status = result.timedOut ? 'timed out' : `exit code ${result.exitCode ?? 'unknown'}`;
    return `\n[${stage}: ${status}]\n${result.output}`;
  }

  private parseMilestoneTestResult(output: string): {
    passRatePct: number;
    passedTests: number;
    testResults: MilestoneTestResult[];
    totalTests: number;
  } | null {
    const markerIndex = output.lastIndexOf(MILESTONE_RESULT_MARKER);

    if (markerIndex === -1) {
      return null;
    }

    const markerPayload = output.slice(markerIndex + MILESTONE_RESULT_MARKER.length);
    const jsonLine = markerPayload.split(/\r?\n/, 1)[0]?.trim();

    if (!jsonLine) {
      return null;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonLine);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { passedTests, tests, totalTests } = parsed as Record<string, unknown>;

    if (
      typeof passedTests !== 'number' ||
      typeof totalTests !== 'number' ||
      !Number.isInteger(passedTests) ||
      !Number.isInteger(totalTests) ||
      totalTests !== MILESTONE_TEST_SUITE_CASE_COUNT ||
      passedTests < 0 ||
      passedTests > totalTests ||
      !Array.isArray(tests) ||
      tests.length !== MILESTONE_TEST_SUITE_CASE_COUNT
    ) {
      return null;
    }

    const testResults: MilestoneTestResult[] = [];

    for (const test of tests) {
      if (!test || typeof test !== 'object' || Array.isArray(test)) {
        return null;
      }

      const { message, name, passed } = test as Record<string, unknown>;

      if (typeof name !== 'string' || typeof passed !== 'boolean' || typeof message !== 'string') {
        return null;
      }

      const sanitizedName = this.sanitizeMilestoneTestResultText(
        name,
        MILESTONE_TEST_RESULT_NAME_LIMIT,
      );
      const sanitizedMessage = this.sanitizeMilestoneTestResultText(
        message,
        MILESTONE_TEST_RESULT_MESSAGE_LIMIT,
      );

      if (sanitizedName.length === 0) {
        return null;
      }

      testResults.push({
        message: sanitizedMessage,
        name: sanitizedName,
        passed,
      });
    }

    if (passedTests !== testResults.filter((test) => test.passed).length) {
      return null;
    }

    return {
      passRatePct: Math.round((passedTests / totalTests) * 10_000) / 100,
      passedTests,
      testResults,
      totalTests,
    };
  }

  private sanitizeMilestoneTestResultText(value: string, limit: number): string {
    const sanitized = value.replace(ANSI_ESCAPE_PATTERN, '').trim();

    if (sanitized.length <= limit) {
      return sanitized;
    }

    return `${sanitized.slice(0, limit - 3)}...`;
  }

  private formatMilestoneTestResultSummary(
    result: { passRatePct: number; passedTests: number; totalTests: number },
    passThresholdPct: number,
  ): string {
    return (
      `\n[result]\n${result.passedTests}/${result.totalTests} generated tests passed ` +
      `(${result.passRatePct}%). Threshold: ${passThresholdPct}%.\n`
    );
  }

  private appendOutputLog(currentLog: string, nextOutput: string): string {
    return this.sanitizeMilestoneOutputLog(`${currentLog}${nextOutput}`);
  }

  private sanitizeMilestoneOutputLog(outputLog: string): string {
    const sanitized = outputLog.replace(ANSI_ESCAPE_PATTERN, '');

    if (sanitized.length <= MILESTONE_OUTPUT_LOG_LIMIT) {
      return sanitized;
    }

    return sanitized.slice(sanitized.length - MILESTONE_OUTPUT_LOG_LIMIT);
  }
}
