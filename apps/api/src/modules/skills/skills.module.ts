import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminSkillResourcesController } from './admin-skill-resources.controller';
import { AdminSkillResourcesService } from './admin-skill-resources.service';
import { AdminSkillsController } from './admin-skills.controller';
import { AdminSkillsService } from './admin-skills.service';

@Module({
  controllers: [AdminSkillsController, AdminSkillResourcesController],
  imports: [PrismaModule],
  providers: [AdminSkillsService, AdminSkillResourcesService],
})
export class SkillsModule {}
