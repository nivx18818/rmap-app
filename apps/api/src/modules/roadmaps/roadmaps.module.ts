import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiRoadmapService } from './ai-roadmap.service';
import { DagreLayoutService } from './dagre-layout.service';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [AiModule, PrismaModule],
  controllers: [RoadmapsController],
  providers: [RoadmapsService, AiRoadmapService, DagreLayoutService],
})
export class RoadmapsModule {}
