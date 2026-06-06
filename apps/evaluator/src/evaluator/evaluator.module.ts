import { Module } from '@nestjs/common';

import { CommandRunnerService } from './command-runner.service';
import { EvaluatorAuthService } from './evaluator-auth.service';
import { EvaluatorController } from './evaluator.controller';
import { EvaluatorService } from './evaluator.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [EvaluatorController, HealthController],
  providers: [CommandRunnerService, EvaluatorAuthService, EvaluatorService],
})
export class EvaluatorModule {}
