import type { RoadmapNode, SkillNode } from '@/types/roadmap';

export const FIGMA_GRAPH_ILLUSTRATION =
  'https://www.figma.com/api/mcp/asset/321a7f38-8b35-4b87-b70d-37a26045c973';

export const ARTBOARD_WIDTH = 1560;
export const MAIN_NODE_WIDTH = 300;
export const MAIN_NODE_X = 630;

export type Side = 'left' | 'right';
export type GroupDirection = 'row' | 'column';

export interface GroupLayout {
  bridgeToX?: number;
  connectorWidth?: number;
  direction: GroupDirection;
  gap?: number;
  pillMinWidth?: number;
  side: Side;
  x: number;
  y: number;
}

export interface RowConfig {
  key: string;
  left?: GroupLayout;
  right?: GroupLayout;
  y: number;
}

export interface AbsoluteBridgeLine {
  left: number;
  top: number;
  width: number;
}

export const ROW_CONFIGS: RowConfig[] = [
  {
    key: 'Version Control Systems',
    y: 1584,
    right: {
      bridgeToX: 770,
      connectorWidth: 22,
      direction: 'row',
      gap: 8,
      pillMinWidth: 108,
      side: 'right',
      x: 882,
      y: 1565,
    },
  },
  {
    key: 'VCS Hosting',
    y: 1682,
    left: {
      bridgeToX: 520,
      connectorWidth: 16,
      direction: 'row',
      gap: 8,
      pillMinWidth: 96,
      side: 'left',
      x: 132,
      y: 1664,
    },
  },
  {
    key: 'Package Managers',
    y: 1790,
    left: {
      bridgeToX: 592,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 78,
      side: 'left',
      x: 330,
      y: 1772,
    },
    right: {
      bridgeToX: 906,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 78,
      side: 'right',
      x: 924,
      y: 1772,
    },
  },
  {
    key: 'Learn Framework',
    y: 1938,
    right: {
      bridgeToX: 870,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 104,
      side: 'right',
      x: 892,
      y: 1920,
    },
  },
  {
    key: 'Pick a Framework',
    y: 2060,
    left: {
      bridgeToX: 520,
      connectorWidth: 20,
      direction: 'row',
      gap: 8,
      pillMinWidth: 84,
      side: 'left',
      x: 144,
      y: 2042,
    },
  },
  {
    key: 'Modern CSS',
    y: 2168,
    left: {
      bridgeToX: 544,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 100,
      side: 'left',
      x: 196,
      y: 2148,
    },
    right: {
      bridgeToX: 904,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 94,
      side: 'right',
      x: 902,
      y: 2148,
    },
  },
  {
    key: 'Build Tools',
    y: 2280,
    right: {
      bridgeToX: 882,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 74,
      side: 'right',
      x: 900,
      y: 2262,
    },
  },
  {
    key: 'CSS Architecture',
    y: 2398,
    left: {
      bridgeToX: 504,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 84,
      side: 'left',
      x: 116,
      y: 2380,
    },
  },
  {
    key: 'CSS Preprocessors',
    y: 2502,
    left: {
      bridgeToX: 584,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 80,
      side: 'left',
      x: 248,
      y: 2484,
    },
    right: {
      bridgeToX: 902,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 68,
      side: 'right',
      x: 922,
      y: 2484,
    },
  },
  {
    key: 'Testing your Apps',
    y: 2618,
    right: {
      bridgeToX: 844,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 74,
      side: 'right',
      x: 868,
      y: 2600,
    },
  },
  {
    key: 'Type Checkers',
    y: 2730,
    left: {
      bridgeToX: 566,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 86,
      side: 'left',
      x: 214,
      y: 2712,
    },
  },
  {
    key: 'Web Components',
    y: 2840,
    left: {
      bridgeToX: 486,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 104,
      side: 'left',
      x: 60,
      y: 2822,
    },
    right: {
      bridgeToX: 844,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 98,
      side: 'right',
      x: 868,
      y: 2822,
    },
  },
  {
    key: 'SSR',
    y: 2950,
    right: {
      bridgeToX: 844,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 70,
      side: 'right',
      x: 868,
      y: 2932,
    },
  },
  {
    key: 'GraphQL',
    y: 3060,
    left: {
      bridgeToX: 518,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 92,
      side: 'left',
      x: 110,
      y: 3042,
    },
  },
  {
    key: 'Static Site Generators',
    y: 3168,
    left: {
      bridgeToX: 588,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 78,
      side: 'left',
      x: 300,
      y: 3150,
    },
    right: {
      bridgeToX: 844,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 88,
      side: 'right',
      x: 868,
      y: 3150,
    },
  },
  {
    key: 'Progressive Web Apps',
    y: 3278,
    right: {
      bridgeToX: 844,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 114,
      side: 'right',
      x: 868,
      y: 3260,
    },
  },
  {
    key: 'Web Security',
    y: 3388,
    left: {
      bridgeToX: 494,
      connectorWidth: 18,
      direction: 'row',
      gap: 8,
      pillMinWidth: 78,
      side: 'left',
      x: 70,
      y: 3370,
    },
  },
  {
    key: 'Storage',
    y: 3488,
    left: {
      bridgeToX: 582,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 94,
      side: 'left',
      x: 236,
      y: 3470,
    },
    right: {
      bridgeToX: 904,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 78,
      side: 'right',
      x: 918,
      y: 3470,
    },
  },
  {
    key: 'Accessibility',
    y: 3596,
    right: {
      bridgeToX: 900,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 64,
      side: 'right',
      x: 914,
      y: 3578,
    },
  },
  {
    key: 'Modern APIs',
    y: 3710,
    left: {
      bridgeToX: 470,
      connectorWidth: 16,
      direction: 'row',
      gap: 8,
      pillMinWidth: 88,
      side: 'left',
      x: 8,
      y: 3692,
    },
  },
  {
    key: 'Linters / Formatters',
    y: 3812,
    left: {
      bridgeToX: 612,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 68,
      side: 'left',
      x: 330,
      y: 3794,
    },
    right: {
      bridgeToX: 900,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 82,
      side: 'right',
      x: 914,
      y: 3794,
    },
  },
  {
    key: 'Module Bundlers',
    y: 3928,
    right: {
      bridgeToX: 836,
      connectorWidth: 16,
      direction: 'row',
      gap: 8,
      pillMinWidth: 92,
      side: 'right',
      x: 848,
      y: 3910,
    },
  },
  {
    key: 'Authentication Strategies',
    y: 4038,
    left: {
      bridgeToX: 492,
      connectorWidth: 16,
      direction: 'row',
      gap: 8,
      pillMinWidth: 86,
      side: 'left',
      x: 38,
      y: 4020,
    },
  },
  {
    key: 'Web Performance',
    y: 4142,
    left: {
      bridgeToX: 598,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 96,
      side: 'left',
      x: 264,
      y: 4124,
    },
    right: {
      bridgeToX: 900,
      connectorWidth: 14,
      direction: 'row',
      gap: 8,
      pillMinWidth: 94,
      side: 'right',
      x: 914,
      y: 4124,
    },
  },
];

export const SPECIAL_ROW_BRIDGES: Partial<
  Record<string, { left?: AbsoluteBridgeLine; right?: AbsoluteBridgeLine }>
> = {
  Accessibility: {
    right: { left: 930, top: 3629, width: 28 },
  },
  'Build Tools': {
    right: { left: 930, top: 2309, width: 18 },
  },
  'CSS Preprocessors': {
    left: { left: 600, top: 2521, width: 30 },
    right: { left: 930, top: 2521, width: 14 },
  },
  'Learn Framework': {
    right: { left: 930, top: 1957, width: 18 },
  },
  'Linters / Formatters': {
    left: { left: 614, top: 3831, width: 16 },
    right: { left: 930, top: 3831, width: 14 },
  },
  'Modern CSS': {
    left: { left: 594, top: 2201, width: 36 },
    right: { left: 930, top: 2201, width: 26 },
  },
  'Package Managers': {
    left: { left: 588, top: 1825, width: 42 },
    right: { left: 930, top: 1825, width: 18 },
  },
  Storage: {
    left: { left: 602, top: 3507, width: 28 },
    right: { left: 930, top: 3507, width: 14 },
  },
  'VCS Hosting': {
    left: { left: 602, top: 1701, width: 28 },
  },
  'Web Performance': {
    left: { left: 600, top: 4161, width: 30 },
    right: { left: 930, top: 4161, width: 14 },
  },
};

export function getNodeByLabel(nodes: RoadmapNode[], label: string) {
  return nodes.find((node) => node.label === label);
}

export function splitSkillGroups(node: RoadmapNode) {
  switch (node.label) {
    case 'Package Managers':
    case 'Modern CSS':
    case 'CSS Preprocessors':
    case 'Storage':
    case 'Linters / Formatters':
    case 'Web Components':
    case 'Static Site Generators':
      return {
        left: node.skills.slice(0, 2),
        right: node.skills.slice(2),
      };
    default:
      return {
        left: node.skills,
        right: [] as SkillNode[],
      };
  }
}
