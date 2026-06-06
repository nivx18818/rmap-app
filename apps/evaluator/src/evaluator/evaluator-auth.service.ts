import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

@Injectable()
export class EvaluatorAuthService {
  constructor(private readonly configService: ConfigService) {}

  assertValidSignature(input: {
    rawBody: Buffer;
    signature: string | string[] | undefined;
    timestamp: string | string[] | undefined;
  }): void {
    const sharedSecret = this.configService.get<string>('EVALUATOR_SHARED_SECRET')?.trim();

    if (!sharedSecret) {
      throw new UnauthorizedException('Evaluator shared secret is not configured');
    }

    if (typeof input.timestamp !== 'string' || typeof input.signature !== 'string') {
      throw new UnauthorizedException('Missing evaluator signature');
    }

    const timestampMs = Number(input.timestamp);

    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > SIGNATURE_MAX_AGE_MS
    ) {
      throw new UnauthorizedException('Stale evaluator signature');
    }

    const expectedSignature = createHmac('sha256', sharedSecret)
      .update(`${input.timestamp}.${input.rawBody.toString('utf8')}`)
      .digest('hex');

    if (!this.isEqualSignature(input.signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid evaluator signature');
    }
  }

  private isEqualSignature(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
