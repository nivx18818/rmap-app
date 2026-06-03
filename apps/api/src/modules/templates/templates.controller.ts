import { Controller, Get, Param, Query } from '@nestjs/common';

import type {
  PaginatedRoadmapsResponseDto,
  RoadmapResponseDto,
} from '@/modules/roadmaps/dto/roadmap-response.dto';

import { Public } from '@/common/decorators/public.decorator';

import type { TemplateCategoriesResponseDto } from './dto/template-categories-response.dto';
import type { TemplateRoadmapNodesResponseDto } from './dto/template-node-response.dto';
import type { TemplateRecommendationsResponseDto } from './dto/template-recommendations-response.dto';
import type { TemplateTrendingsResponseDto } from './dto/template-trendings-response.dto';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { ListTemplatesQueryDto } from './dto/list-templates-query.dto';
import { TemplateNodesFilterDto } from './dto/template-nodes-filter.dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Public()
  @Get()
  async listTemplates(
    @Query() query: ListTemplatesQueryDto,
  ): Promise<PaginatedRoadmapsResponseDto> {
    return this.templatesService.listTemplates(query);
  }

  @Public()
  @Get('categories')
  async listCategories(): Promise<TemplateCategoriesResponseDto> {
    return this.templatesService.listCategories();
  }

  @Get('recommendations')
  async getRecommendations(
    @CurrentUser() user: RequestUser,
  ): Promise<TemplateRecommendationsResponseDto> {
    return this.templatesService.getRecommendations(user.id);
  }

  @Public()
  @Get('trendings')
  async listTrendings(): Promise<TemplateTrendingsResponseDto> {
    return this.templatesService.listTrendings();
  }

  @Public()
  @Get(':templateId/nodes')
  async listTemplateNodes(
    @Param('templateId') templateId: string,
    @Query() query: TemplateNodesFilterDto,
  ): Promise<TemplateRoadmapNodesResponseDto> {
    return this.templatesService.listTemplateNodes(templateId, query);
  }

  @Public()
  @Get(':templateId')
  async getTemplate(@Param('templateId') templateId: string): Promise<RoadmapResponseDto> {
    return this.templatesService.getTemplate(templateId);
  }
}
