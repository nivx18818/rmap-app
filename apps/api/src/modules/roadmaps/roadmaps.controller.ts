import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import type { PaginatedRoadmapsResponseDto, RoadmapResponseDto } from './dto/roadmap-response.dto';
import type { NodeDetailResponse } from './types/roadmap-nodes.types';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { ListRoadmapsQueryDto } from './dto/list-roadmaps-query.dto';
import { RoadmapNodesFilterDto } from './dto/roadmap-nodes-filter.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateNodeProgressDto } from './dto/update-node-progress.dto';
import { RoadmapsService } from './roadmaps.service';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  async listRoadmaps(
    @CurrentUser() user: RequestUser,
    @Query() query: ListRoadmapsQueryDto,
  ): Promise<PaginatedRoadmapsResponseDto> {
    return this.roadmapsService.listUserRoadmaps(user.id, query);
  }

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

  /**
   * GET /roadmaps/:roadmapId/nodes/:nodeId
   *
   * Returns full sidebar content for a clicked node: node metadata + progress,
   * skill detail, resources (primaries first), and prerequisites.
   */
  @Get(':roadmapId/nodes/:nodeId')
  async getNodeDetail(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<NodeDetailResponse> {
    return this.roadmapsService.getNodeDetail(user.id, roadmapId, nodeId);
  }

  @Get(':roadmapId')
  async get(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
  ): Promise<RoadmapResponseDto> {
    return this.roadmapsService.getByIdForOwner(user.id, roadmapId);
  }

  @Delete(':roadmapId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: RequestUser, @Param('roadmapId') roadmapId: string) {
    await this.roadmapsService.deleteByIdForOwner(user.id, roadmapId);
  }

  /**
   * GET /roadmaps/:roadmapId/nodes/:nodeId/quiz
   *
   * Returns exactly 5 public quiz questions for a required/optional leaf node's skill.
   */
  @Get(':roadmapId/nodes/:nodeId/quiz')
  async getNodeQuiz(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.roadmapsService.getNodeQuiz(user.id, roadmapId, nodeId);
  }

  /**
   * POST /roadmaps/:roadmapId/nodes/:nodeId/quiz/submit
   *
   * Scores a required/optional leaf node quiz and updates the user's node progress.
   */
  @Post(':roadmapId/nodes/:nodeId/quiz/submit')
  @HttpCode(HttpStatus.OK)
  async submitNodeQuiz(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.roadmapsService.submitNodeQuiz(user.id, roadmapId, nodeId, dto);
  }

  /**
   * PATCH /roadmaps/:roadmapId/nodes/:nodeId/progress
   *
   * Updates a node's status with side effects: daily_activity upsert,
   * parent group auto-complete, milestone unlock, and next group unlock.
   */
  @Patch(':roadmapId/nodes/:nodeId/progress')
  @HttpCode(HttpStatus.OK)
  async updateNodeProgress(
    @CurrentUser() user: RequestUser,
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateNodeProgressDto,
  ) {
    return this.roadmapsService.updateNodeProgress(user.id, roadmapId, nodeId, dto);
  }
}
