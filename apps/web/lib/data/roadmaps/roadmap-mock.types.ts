import type { RoadmapIntroCardData, RoadmapNodePanelData } from '@/types/roadmap';

export type MockRoadmapNodeKind = 'title' | 'main' | 'sub';
export type MockRoadmapRelationType = 'required' | 'optional';

export interface MockRoadmapLogicNode {
  id: string;
  kind: MockRoadmapNodeKind;
  label: string;
  parentId: string | null;
  relationType?: MockRoadmapRelationType;
  sortOrder: number;
}

export interface MockRoadmapLogic {
  introCard: RoadmapIntroCardData;
  nodePanel: RoadmapNodePanelData;
  description: string;
  nodes: MockRoadmapLogicNode[];
  roadmapId: string;
  title: string;
}

export interface MockRoadmapLayoutNode {
  nodeId: string;
  position: {
    x: number;
    y: number;
  };
}

export interface MockRoadmapLayout {
  nodes: MockRoadmapLayoutNode[];
  roadmapId: string;
}
