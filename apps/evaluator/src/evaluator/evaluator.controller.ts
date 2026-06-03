import type { Request } from 'express';

import { Body, Controller, Post, Req } from '@nestjs/common';

import type { EvaluatorResponse } from './types';

import { ExecuteEvaluatorDto } from './dto/execute-evaluator.dto';
import { EvaluatorAuthService } from './evaluator-auth.service';
import { EvaluatorService } from './evaluator.service';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@Controller('internal/evaluator')
export class EvaluatorController {
  constructor(
    private readonly authService: EvaluatorAuthService,
    private readonly evaluatorService: EvaluatorService,
  ) {}

  @Post('execute')
  execute(
    @Body() dto: ExecuteEvaluatorDto,
    @Req() request: RawBodyRequest,
  ): Promise<EvaluatorResponse> {
    this.authService.assertValidSignature({
      rawBody: request.rawBody ?? Buffer.alloc(0),
      signature: request.headers['x-rmap-signature'],
      timestamp: request.headers['x-rmap-timestamp'],
    });

    return this.evaluatorService.execute(dto);
  }
}
