import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { RoadmapNodesFilterDto } from './dto/roadmap-nodes-filter.dto';
import { RoadmapsService } from './roadmaps.service';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  /**
   * POST /roadmaps/generate
   *
   * End of the onboarding flow. Validates the timeline, calls the Gemini AI
   * engine with the role skill map, computes Dagre layout, and persists the
   * roadmap + nodes + initial user_node_progress rows.
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() dto: GenerateRoadmapDto, @CurrentUser() user: RequestUser) {
    return this.roadmapsService.generate(user.id, dto);
  }

  /**
   * GET /roadmaps/:roadmapId/nodes
   *
   * Returns a flat list of roadmap nodes with embedded progress for the user.
   */
  @Get(':roadmapId/nodes')
  async listNodes(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
    @Query() query: RoadmapNodesFilterDto,
  ) {
    return this.roadmapsService.listNodes(user.id, roadmapId, query);
  }
}
