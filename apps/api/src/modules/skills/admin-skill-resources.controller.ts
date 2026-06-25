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
} from '@nestjs/common';
import { UserRole } from '@repo/db/prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';

import type {
  SkillResourceListResponse,
  SkillResourceResponse,
} from './types/admin-skill-resource-response.types';

import { AdminSkillResourcesService } from './admin-skill-resources.service';
import {
  SkillResourceListParamsDto,
  SkillResourceParamsDto,
} from './dto/admin-skill-resource-params.dto';
import { CreateSkillResourceDto, UpdateSkillResourceDto } from './dto/admin-skill-resource.dto';

@Controller('admin/skills/:skillId/resources')
@Roles(UserRole.ADMIN)
export class AdminSkillResourcesController {
  constructor(private readonly adminSkillResourcesService: AdminSkillResourcesService) {}

  @Get()
  async list(@Param() params: SkillResourceListParamsDto): Promise<SkillResourceListResponse> {
    return this.adminSkillResourcesService.listResources(params.skillId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param() params: SkillResourceListParamsDto,
    @Body() dto: CreateSkillResourceDto,
  ): Promise<SkillResourceResponse> {
    return this.adminSkillResourcesService.createResource(params.skillId, dto);
  }

  @Put(':resourceId')
  async update(
    @Param() params: SkillResourceParamsDto,
    @Body() dto: UpdateSkillResourceDto,
  ): Promise<SkillResourceResponse> {
    return this.adminSkillResourcesService.updateResource(params.skillId, params.resourceId, dto);
  }

  @Delete(':resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: SkillResourceParamsDto): Promise<void> {
    await this.adminSkillResourcesService.deleteResource(params.skillId, params.resourceId);
  }
}
