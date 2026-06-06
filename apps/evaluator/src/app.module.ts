import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EvaluatorModule } from './evaluator/evaluator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EvaluatorModule,
  ],
})
export class AppModule {}
