import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminSkillPrerequisitesController } from './admin-skill-prerequisites.controller';
import { AdminSkillPrerequisitesService } from './admin-skill-prerequisites.service';
import { AdminSkillResourcesController } from './admin-skill-resources.controller';
import { AdminSkillResourcesService } from './admin-skill-resources.service';
import { AdminSkillsController } from './admin-skills.controller';
import { AdminSkillsService } from './admin-skills.service';

@Module({
  controllers: [
    AdminSkillsController,
    AdminSkillPrerequisitesController,
    AdminSkillResourcesController,
  ],
  imports: [PrismaModule],
  providers: [AdminSkillsService, AdminSkillPrerequisitesService, AdminSkillResourcesService],
})
export class SkillsModule {}
