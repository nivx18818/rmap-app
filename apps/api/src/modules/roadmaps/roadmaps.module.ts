import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MilestoneExecutionClient } from './milestone-execution.client';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';
import { DagreLayoutService } from './services/dagre-layout.service';
import { RoadmapGenerationService } from './services/roadmap-generation.service';
import { RoadmapMilestoneService } from './services/roadmap-milestone.service';
import { RoadmapProgressService } from './services/roadmap-progress.service';
import { RoadmapQueryService } from './services/roadmap-query.service';
import { RoadmapQuizService } from './services/roadmap-quiz.service';

@Module({
  imports: [AiModule, PrismaModule],
  controllers: [RoadmapsController],
  providers: [
    RoadmapsService,
    RoadmapGenerationService,
    RoadmapQueryService,
    RoadmapProgressService,
    RoadmapQuizService,
    RoadmapMilestoneService,
    DagreLayoutService,
    MilestoneExecutionClient,
  ],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
