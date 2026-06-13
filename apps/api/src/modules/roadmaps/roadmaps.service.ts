import { Injectable } from '@nestjs/common';

import type { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import type { ListRoadmapsQueryDto } from './dto/list-roadmaps-query.dto';
import type { RoadmapNodesFilterDto } from './dto/roadmap-nodes-filter.dto';
import type { PaginatedRoadmapsResponseDto, RoadmapResponseDto } from './dto/roadmap-response.dto';
import type { SubmitMilestoneSubmissionDto } from './dto/submit-milestone-submission.dto';
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type { UpdateNodeProgressDto } from './dto/update-node-progress.dto';
import type { RoadmapNodeQuizResponse, SubmitQuizResponse } from './types/roadmap-node-quiz.types';
import type {
  LatestMilestoneSubmissionResponse,
  MilestoneSubmissionEnvelopeResponse,
  NodeDetailResponse,
  RoadmapNodesListResponse,
  StartRoadmapResponse,
  UpdateNodeProgressResponse,
} from './types/roadmap-nodes.types';
import type { RoadmapProgressSummaryResponse } from './types/roadmap-progress.types';

import { RoadmapGenerationService } from './services/roadmap-generation.service';
import { RoadmapMilestoneService } from './services/roadmap-milestone.service';
import { RoadmapProgressService } from './services/roadmap-progress.service';
import { RoadmapQueryService } from './services/roadmap-query.service';
import { RoadmapQuizService } from './services/roadmap-quiz.service';

@Injectable()
export class RoadmapsService {
  constructor(
    private readonly roadmapGeneration: RoadmapGenerationService,
    private readonly roadmapQuery: RoadmapQueryService,
    private readonly roadmapProgress: RoadmapProgressService,
    private readonly roadmapQuiz: RoadmapQuizService,
    private readonly roadmapMilestone: RoadmapMilestoneService,
  ) {}

  async listUserRoadmaps(
    userId: string,
    query: ListRoadmapsQueryDto,
  ): Promise<PaginatedRoadmapsResponseDto> {
    return this.roadmapQuery.listUserRoadmaps(userId, query);
  }

  async listNodes(
    userId: string,
    roadmapId: string,
    query: RoadmapNodesFilterDto,
  ): Promise<RoadmapNodesListResponse> {
    return this.roadmapQuery.listNodes(userId, roadmapId, query);
  }

  async getProgressSummary(
    userId: string,
    roadmapId: string,
  ): Promise<RoadmapProgressSummaryResponse> {
    return this.roadmapProgress.getProgressSummary(userId, roadmapId);
  }

  async getNodeDetail(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<NodeDetailResponse> {
    return this.roadmapQuery.getNodeDetail(userId, roadmapId, nodeId);
  }

  async getNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<RoadmapNodeQuizResponse> {
    return this.roadmapQuiz.getNodeQuiz(userId, roadmapId, nodeId);
  }

  async submitNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitQuizDto,
  ): Promise<SubmitQuizResponse> {
    return this.roadmapQuiz.submitNodeQuiz(userId, roadmapId, nodeId, dto);
  }

  async submitMilestoneSubmission(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitMilestoneSubmissionDto,
  ): Promise<MilestoneSubmissionEnvelopeResponse> {
    return this.roadmapMilestone.submitMilestoneSubmission(userId, roadmapId, nodeId, dto);
  }

  async getLatestMilestoneSubmission(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<LatestMilestoneSubmissionResponse> {
    return this.roadmapMilestone.getLatestMilestoneSubmission(userId, roadmapId, nodeId);
  }

  async generate(userId: string, dto: GenerateRoadmapDto) {
    return this.roadmapGeneration.generate(userId, dto);
  }

  async updateNodeProgress(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: UpdateNodeProgressDto,
  ): Promise<UpdateNodeProgressResponse> {
    return this.roadmapProgress.updateNodeProgress(userId, roadmapId, nodeId, dto);
  }

  async getByIdForOwner(userId: string, roadmapId: string): Promise<RoadmapResponseDto> {
    return this.roadmapQuery.getByIdForOwner(userId, roadmapId);
  }

  async startLearning(userId: string, roadmapId: string): Promise<StartRoadmapResponse> {
    return this.roadmapProgress.startLearning(userId, roadmapId);
  }

  async deleteRoadmapProgress(userId: string, roadmapId: string): Promise<void> {
    return this.roadmapProgress.deleteRoadmapProgress(userId, roadmapId);
  }

  async deleteByIdForOwner(userId: string, roadmapId: string): Promise<void> {
    return this.roadmapQuery.deleteByIdForOwner(userId, roadmapId);
  }
}
