import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { UserRole } from '@repo/db/prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';

import type { SkillPrerequisiteListResponse } from './types/admin-skill-prerequisite-response.types';

import { AdminSkillPrerequisitesService } from './admin-skill-prerequisites.service';
import {
  SkillPrerequisiteListParamsDto,
  SkillPrerequisiteParamsDto,
} from './dto/admin-skill-prerequisite-params.dto';
import { CreateSkillPrerequisiteDto } from './dto/admin-skill-prerequisite.dto';

@Controller('admin/skills/:skillId/prerequisites')
@Roles(UserRole.ADMIN)
export class AdminSkillPrerequisitesController {
  constructor(private readonly adminSkillPrerequisitesService: AdminSkillPrerequisitesService) {}

  @Get()
  async list(
    @Param() params: SkillPrerequisiteListParamsDto,
  ): Promise<SkillPrerequisiteListResponse> {
    return this.adminSkillPrerequisitesService.listPrerequisites(params.skillId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param() params: SkillPrerequisiteListParamsDto,
    @Body() dto: CreateSkillPrerequisiteDto,
  ): Promise<void> {
    await this.adminSkillPrerequisitesService.createPrerequisite(params.skillId, dto);
  }

  @Delete(':prereqSkillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: SkillPrerequisiteParamsDto): Promise<void> {
    await this.adminSkillPrerequisitesService.deletePrerequisite(
      params.skillId,
      params.prereqSkillId,
    );
  }
}
