import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserRole } from '@repo/db/prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';

import type {
  AdminSkillsListResponse,
  SkillDetailResponse,
  SkillResponse,
} from './types/admin-skill-response.types';

import { AdminSkillsService } from './admin-skills.service';
import { SkillIdParamDto } from './dto/admin-skill-params.dto';
import { ListAdminSkillsQueryDto } from './dto/admin-skill-query.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/admin-skill.dto';

@Controller('admin/skills')
@Roles(UserRole.ADMIN)
export class AdminSkillsController {
  constructor(private readonly adminSkillsService: AdminSkillsService) {}

  @Get()
  async list(@Query() query: ListAdminSkillsQueryDto): Promise<AdminSkillsListResponse> {
    return this.adminSkillsService.listSkills(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSkillDto): Promise<SkillResponse> {
    return this.adminSkillsService.createSkill(dto);
  }

  @Get(':skillId')
  async get(@Param() params: SkillIdParamDto): Promise<SkillDetailResponse> {
    return this.adminSkillsService.getSkill(params.skillId);
  }

  @Put(':skillId')
  async update(
    @Param() params: SkillIdParamDto,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponse> {
    return this.adminSkillsService.updateSkill(params.skillId, dto);
  }

  @Delete(':skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: SkillIdParamDto): Promise<void> {
    await this.adminSkillsService.deleteSkill(params.skillId);
  }
}
