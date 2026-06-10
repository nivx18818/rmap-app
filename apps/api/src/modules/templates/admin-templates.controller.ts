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

import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';

import { Roles } from '@/common/decorators/roles.decorator';

import type {
  AdminTemplatesListResponse,
  TemplateNodeResponse,
} from './types/admin-template-response.types';

import { AdminTemplatesService } from './admin-templates.service';
import { CreateTemplateNodeDto, UpdateTemplateNodeDto } from './dto/admin-template-node.dto';
import { TemplateIdParamDto, TemplateNodeIdParamDto } from './dto/admin-template-params.dto';
import { ListAdminTemplatesQueryDto } from './dto/admin-template-query.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/admin-template.dto';

@Controller('admin/templates')
@Roles(UserRole.ADMIN)
export class AdminTemplatesController {
  constructor(private readonly adminTemplatesService: AdminTemplatesService) {}

  @Get()
  async list(@Query() query: ListAdminTemplatesQueryDto): Promise<AdminTemplatesListResponse> {
    return this.adminTemplatesService.listTemplates(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTemplateDto): Promise<RoadmapResponseDto> {
    return this.adminTemplatesService.createTemplate(dto);
  }

  @Get(':templateId')
  async get(@Param() params: TemplateIdParamDto): Promise<RoadmapResponseDto> {
    return this.adminTemplatesService.getTemplate(params.templateId);
  }

  @Put(':templateId')
  async update(
    @Param() params: TemplateIdParamDto,
    @Body() dto: UpdateTemplateDto,
  ): Promise<RoadmapResponseDto> {
    return this.adminTemplatesService.updateTemplate(params.templateId, dto);
  }

  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: TemplateIdParamDto): Promise<void> {
    await this.adminTemplatesService.deleteTemplate(params.templateId);
  }

  @Post(':templateId/nodes')
  @HttpCode(HttpStatus.CREATED)
  async createNode(
    @Param() params: TemplateIdParamDto,
    @Body() dto: CreateTemplateNodeDto,
  ): Promise<TemplateNodeResponse> {
    return this.adminTemplatesService.createNode(params.templateId, dto);
  }

  @Put(':templateId/nodes/:nodeId')
  async updateNode(
    @Param() params: TemplateNodeIdParamDto,
    @Body() dto: UpdateTemplateNodeDto,
  ): Promise<TemplateNodeResponse> {
    return this.adminTemplatesService.updateNode(params.templateId, params.nodeId, dto);
  }

  @Delete(':templateId/nodes/:nodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeNode(@Param() params: TemplateNodeIdParamDto): Promise<void> {
    await this.adminTemplatesService.deleteNode(params.templateId, params.nodeId);
  }
}
