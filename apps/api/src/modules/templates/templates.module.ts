import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DagreLayoutService } from '../roadmaps/services/dagre-layout.service';
import { AdminTemplatesController } from './admin-templates.controller';
import { AdminTemplatesService } from './admin-templates.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [PrismaModule],
  controllers: [TemplatesController, AdminTemplatesController],
  providers: [TemplatesService, AdminTemplatesService, DagreLayoutService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
