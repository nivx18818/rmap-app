import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilestoneSubmissionStatus } from '@repo/db/prisma/client';
import { createHmac } from 'node:crypto';

import type { MilestoneSubmissionTestResultResponse } from './types/roadmap-nodes.types';

export type MilestoneExecutionRequest = {
  repoUrl: string;
  submissionId: string;
  testFileContent: string;
  timeoutMs: number;
};

export type MilestoneExecutionResult = {
  outputLog: string;
  passedTests: number | null;
  passRatePct: number | null;
  status: MilestoneSubmissionStatus;
  testResults: MilestoneSubmissionTestResultResponse[] | null;
  totalTests: number | null;
};

const EVALUATOR_EXECUTE_PATH = '/internal/evaluator/execute';

@Injectable()
export class MilestoneExecutionClient {
  private readonly logger = new Logger(MilestoneExecutionClient.name);

  constructor(private readonly configService: ConfigService) {}

  async execute(request: MilestoneExecutionRequest): Promise<MilestoneExecutionResult> {
    const evaluatorUrl = this.configService.get<string>('EVALUATOR_URL')?.trim();
    const sharedSecret = this.configService.get<string>('EVALUATOR_SHARED_SECRET')?.trim();

    if (!evaluatorUrl || !sharedSecret) {
      return this.buildErrorResult('Evaluator is not configured.');
    }

    const rawBody = JSON.stringify(request);
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', sharedSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    try {
      const response = await fetch(new URL(EVALUATOR_EXECUTE_PATH, evaluatorUrl), {
        body: rawBody,
        headers: {
          'content-type': 'application/json',
          'x-rmap-signature': signature,
          'x-rmap-timestamp': timestamp,
        },
        method: 'POST',
      });

      if (!response.ok) {
        return this.buildErrorResult(`Evaluator returned HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as unknown;
      const parsedResult = this.parseExecutionResult(payload);

      if (!parsedResult) {
        return this.buildErrorResult('Evaluator returned a malformed result.');
      }

      return parsedResult;
    } catch (error) {
      this.logger.error('Evaluator request failed', error);
      return this.buildErrorResult('Evaluator is unavailable.');
    }
  }

  private buildErrorResult(message: string): MilestoneExecutionResult {
    return {
      outputLog: `\n[error]\n${message}\n`,
      passRatePct: null,
      passedTests: null,
      status: 'ERROR',
      testResults: null,
      totalTests: null,
    };
  }

  private parseExecutionResult(payload: unknown): MilestoneExecutionResult | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const { outputLog, passRatePct, passedTests, status, testResults, totalTests } =
      payload as Record<string, unknown>;

    if (status !== 'PASSED' && status !== 'FAILED' && status !== 'ERROR') {
      return null;
    }

    if (typeof outputLog !== 'string') {
      return null;
    }

    if (
      (passRatePct !== null && typeof passRatePct !== 'number') ||
      (passedTests !== null && !Number.isInteger(passedTests)) ||
      (totalTests !== null && !Number.isInteger(totalTests))
    ) {
      return null;
    }

    if (testResults !== null && !this.isTestResults(testResults)) {
      return null;
    }

    return {
      outputLog,
      passRatePct: passRatePct,
      passedTests: passedTests as number | null,
      status,
      testResults,
      totalTests: totalTests as number | null,
    };
  }

  private isTestResults(value: unknown): value is MilestoneSubmissionTestResultResponse[] {
    return (
      Array.isArray(value) &&
      value.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          typeof (item as { message?: unknown }).message === 'string' &&
          typeof (item as { name?: unknown }).name === 'string' &&
          typeof (item as { passed?: unknown }).passed === 'boolean',
      )
    );
  }
}
