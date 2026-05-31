import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  RetryableRequestError,
  getRetryAfterMs,
  isRetryableError,
  retryOperation,
} from './retry.js';

test('retries retryable failures and then returns the successful value', async () => {
  const delays: number[] = [];
  let attempts = 0;

  const result = await retryOperation(
    async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new RetryableRequestError('temporary outage', { status: 500 });
      }

      return 'ok';
    },
    {
      baseDelayMs: 25,
      jitter: false,
      sleep: (delayMs) => {
        delays.push(delayMs);
        return Promise.resolve();
      },
    },
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [25]);
});

test('uses retry-after headers for retry delays', async () => {
  const delays: number[] = [];
  let attempts = 0;

  await retryOperation(
    async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new RetryableRequestError('rate limited', {
          headers: { 'retry-after': '2' },
          status: 429,
        });
      }
    },
    {
      sleep: (delayMs) => {
        delays.push(delayMs);
        return Promise.resolve();
      },
    },
  );

  assert.deepEqual(delays, [2000]);
});

test('does not retry non-retryable errors', async () => {
  let attempts = 0;

  await assert.rejects(
    retryOperation(async () => {
      attempts += 1;
      throw new Error('bad request');
    }),
    /bad request/,
  );
  assert.equal(attempts, 1);
});

test('detects GitHub secondary and rate limit responses as retryable', () => {
  assert.equal(
    isRetryableError({
      response: {
        headers: { 'x-ratelimit-remaining': '0' },
        status: 403,
      },
    }),
    true,
  );
  assert.equal(getRetryAfterMs({ 'retry-after': '1' }), 1000);
});
