import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
})
export class RoadmapModule {}
