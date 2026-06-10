import type { NodeType } from '@repo/db/prisma/client';

import type {
  PaginationMetaDto,
  RoadmapResponseDto,
} from '@/modules/roadmaps/dto/roadmap-response.dto';

export interface AdminTemplatesListResponse {
  data: RoadmapResponseDto[];
  meta: PaginationMetaDto;
}

export interface TemplateNodeResponse {
  createdAt: string;
  description: null | string;
  estimatedHours: null | number;
  id: string;
  name: string;
  nodeType: NodeType;
  parentId: null | string;
  posX: number;
  posY: number;
  roadmapId: string;
  skillId: null | string;
}

export interface TemplateNodesListResponse {
  nodes: TemplateNodeResponse[];
}
