import type {
  ApiRoadmapNode,
  ApiRoadmapResponse,
  NodeStatus,
  NormalizedRoadmapNode,
  RoadmapHeroData,
  RoadmapGraphNode,
  RoadmapGraphSkill,
  RoadmapNodePanelDetail,
  RoadmapPageData,
  RoadmapProgress,
  RoadmapWebModel,
  RoadmapWithNodes,
} from '@/types/roadmap';

function getChildApiNodes(children: ApiRoadmapNode[] | string[]) {
  return children.filter((child): child is ApiRoadmapNode => typeof child !== 'string');
}

function getNodeStatus(nodeId: string, progress: RoadmapProgress | null): NodeStatus {
  return progress?.nodes.find((node) => node.roadmap_node_id === nodeId)?.status ?? 'locked';
}

function buildFallbackPanelDetail(
  node: ApiRoadmapNode,
  status: NodeStatus,
): RoadmapNodePanelDetail {
  const hoursLabel =
    typeof node.skill_estimated_hours === 'number' ? `${node.skill_estimated_hours} hours` : null;
  const statusLabel =
    status === 'completed' ? 'completed' : status === 'in_progress' ? 'in progress' : 'pending';

  return {
    description: `${node.skill_name} is a ${node.relation_type} topic in this roadmap and is currently ${statusLabel}${hoursLabel ? `, with an estimated effort of ${hoursLabel}` : ''}.`,
    resources: {
      emptyLabel: 'No resources yet.',
      sections: [],
    },
    tutor: {
      emptyLabel: 'Your AI tutor suggestions will appear here.',
      sections: [],
    },
  };
}

function mapApiNodeToGraphSkill(
  node: ApiRoadmapNode,
  progress: RoadmapProgress | null,
): RoadmapGraphSkill {
  return {
    estimated_hours: node.skill_estimated_hours,
    id: node.skill_id,
    label: node.skill_name,
    roadmap_node_id: node.id,
    relation_type: node.relation_type,
    status: getNodeStatus(node.id, progress),
  };
}

function normalizeApiNode(node: ApiRoadmapNode): NormalizedRoadmapNode {
  const childNodes = getChildApiNodes(node.children);

  return {
    children: childNodes.map(normalizeApiNode),
    id: node.id,
    parent_node_id: node.parent_node_id,
    relation_type: node.relation_type,
    roadmap_id: node.roadmap_id,
    skill_estimated_hours: node.skill_estimated_hours,
    skill_id: node.skill_id,
    skill_name: node.skill_name,
    sort_order: node.sort_order,
  };
}

function mapApiNodeToGraphNode(
  node: ApiRoadmapNode,
  progress: RoadmapProgress | null,
  pageData: RoadmapPageData,
): RoadmapGraphNode {
  const childNodes = getChildApiNodes(node.children);
  const status = getNodeStatus(node.id, progress);

  return {
    id: node.id,
    label: node.skill_name,
    panel: pageData.nodePanel.detailsByNodeId[node.id] ?? buildFallbackPanelDetail(node, status),
    parent_node_id: node.parent_node_id,
    relation_type: node.relation_type,
    roadmap_id: node.roadmap_id,
    skill_estimated_hours: node.skill_estimated_hours,
    skill_id: node.skill_id,
    skill_name: node.skill_name,
    skills: childNodes.map((childNode) => mapApiNodeToGraphSkill(childNode, progress)),
    sort_order: node.sort_order,
    status,
    type: 'roadmap_graph_node',
  };
}

function flattenGraphNodes(
  nodes: ApiRoadmapNode[],
  progress: RoadmapProgress | null,
  pageData: RoadmapPageData,
): RoadmapGraphNode[] {
  return nodes.flatMap((node) => {
    const childNodes = getChildApiNodes(node.children);

    return [
      mapApiNodeToGraphNode(node, progress, pageData),
      ...flattenGraphNodes(childNodes, progress, pageData),
    ];
  });
}

function normalizeRoadmapResponse(roadmapResponse: ApiRoadmapResponse): RoadmapWithNodes {
  return {
    created_at: roadmapResponse.created_at,
    description: roadmapResponse.description,
    id: roadmapResponse.id,
    is_template: roadmapResponse.is_template,
    nodes: roadmapResponse.nodes.map(normalizeApiNode),
    role_id: roadmapResponse.role_id,
    role_name: roadmapResponse.role_name,
    title: roadmapResponse.title,
    type: 'roadmap_based',
    user_id: roadmapResponse.user_id,
  };
}

function formatProgressLabel(progress: RoadmapProgress | null) {
  const completionPercentage = progress?.completion_percentage ?? 0;

  return `${Math.round(completionPercentage)}% DONE`;
}

export function mapRoadmapToHero(
  roadmap: RoadmapWithNodes,
  progress: RoadmapProgress | null,
  pageData: RoadmapPageData,
): RoadmapHeroData {
  return {
    allRoadmapsLabel: pageData.hero.allRoadmapsLabel,
    backHref: pageData.hero.backHref,
    description: roadmap.description ?? '',
    downloadLabel: pageData.hero.downloadLabel,
    progressHint: pageData.hero.progressHint,
    progressLabel: formatProgressLabel(progress),
    trackProgressLabel: pageData.hero.trackProgressLabel,
  };
}

export function mapRoadmapResponseToWebModel(
  roadmapResponse: ApiRoadmapResponse,
  progressResponse: RoadmapProgress | null,
  pageData: RoadmapPageData,
): RoadmapWebModel {
  const roadmap = normalizeRoadmapResponse(roadmapResponse);
  const graphNodes = flattenGraphNodes(roadmapResponse.nodes, progressResponse, pageData);

  return {
    graphNodes,
    hero: mapRoadmapToHero(roadmap, progressResponse, pageData),
    progress: progressResponse,
    roadmap,
    ui: pageData,
  };
}
