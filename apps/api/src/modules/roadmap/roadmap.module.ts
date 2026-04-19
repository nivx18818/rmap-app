import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module';
import { GeminiService } from './gemini.service';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [RoadmapController],
  providers: [RoadmapService, GeminiService],
})
export class RoadmapModule {}
