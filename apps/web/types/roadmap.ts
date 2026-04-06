export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  style?: {
    fontSize?: number;
    justifyContent?: string;
    textAlign?: string;
    borderColor?: string;
    backgroundColor?: string;
    color?: string;
  };
  href?: string; // Dùng cho loại 'button' hoặc 'label'
  oldId?: string;
}

export interface RoadmapNode {
  id: string;
  type: 'paragraph' | 'title' | 'topic' | 'vertical' | 'button' | 'label';
  position: NodePosition;
  data: NodeData;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    strokeLinecap?: string;
  };
}

export interface RoadmapData {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}
