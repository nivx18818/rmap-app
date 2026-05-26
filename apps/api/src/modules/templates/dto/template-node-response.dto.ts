import type { NodeType } from '@repo/db/prisma/client';

export interface TemplateRoadmapNodeDto {
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

export interface TemplateRoadmapNodesResponseDto {
  nodes: TemplateRoadmapNodeDto[];
}
