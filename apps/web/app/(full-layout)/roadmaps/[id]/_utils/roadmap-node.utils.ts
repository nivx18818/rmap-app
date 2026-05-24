import type { NodeType, ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';

export function isAxisNodeType(nodeType: NodeType): boolean {
  return nodeType === 'GROUP' || nodeType === 'MILESTONE';
}

export function isSkillNodeType(nodeType: NodeType): boolean {
  return nodeType === 'REQUIRED' || nodeType === 'OPTIONAL';
}

export function isAxisNode(node: RoadmapNode): boolean {
  return isAxisNodeType(node.nodeType);
}

export function isSkillNode(node: RoadmapNode): boolean {
  return isSkillNodeType(node.nodeType);
}

export function canOpenRoadmapNodeDetail(node: RoadmapNode): boolean {
  return (
    node.nodeType === 'REQUIRED' || node.nodeType === 'OPTIONAL' || node.nodeType === 'MILESTONE'
  );
}

export function getNodeStatus(node: RoadmapNode): ProgressStatus {
  return node.progress?.status ?? 'LOCKED';
}

export function sortRoadmapNodes(left: RoadmapNode, right: RoadmapNode): number {
  return left.posY - right.posY || left.posX - right.posX || left.name.localeCompare(right.name);
}

export function getFirstVisibleNode(nodes: RoadmapNode[]): RoadmapNode | undefined {
  return [...nodes].sort(sortRoadmapNodes)[0];
}

export function getFirstVisibleSpineNode(nodes: RoadmapNode[]): RoadmapNode | undefined {
  return nodes.filter((node) => !node.parentId && isAxisNode(node)).sort(sortRoadmapNodes)[0];
}
