import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminSkillResourcesController } from './admin-skill-resources.controller';
import { AdminSkillResourcesService } from './admin-skill-resources.service';

@Module({
  controllers: [AdminSkillResourcesController],
  imports: [PrismaModule],
  providers: [AdminSkillResourcesService],
})
export class SkillsModule {}
