export type UserRole = 'user' | 'admin';
export type SkillLevel = 'fresher' | 'junior' | 'middle';
export type NodeStatus = 'locked' | 'in_progress' | 'completed';
export type ResourcePlatform = 'udemy' | 'coursera' | 'youtube' | 'other';
export type SkillProficiency = 'none' | 'basic' | 'intermediate';
export type RelationType = 'optional' | 'required';

export type UUID = string;
export type Timestamp = string;

export interface SkillNode {
  category?: string | null;
  description?: string | null;
  estimated_hours?: number | null;
  id: UUID;
  label: string;
  name?: string;
  slug?: string;
  type: 'skill_node';
}

export interface NormalizedRoadmapNode {
  children: NormalizedRoadmapNode[];
  id: UUID;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  sort_order: number;
}

export interface RoadmapGraphSkill {
  estimated_hours?: number | null;
  id: UUID;
  label: string;
  roadmap_node_id: UUID;
  relation_type: RelationType;
  status: NodeStatus;
}

export interface RoadmapGraphNode {
  id: UUID;
  label: string;
  panel: RoadmapNodePanelDetail;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  skills: RoadmapGraphSkill[];
  sort_order: number;
  status: NodeStatus;
  type: 'roadmap_graph_node';
}

export interface ApiRoadmapNode {
  children: ApiRoadmapNode[] | string[];
  id: UUID;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  sort_order: number;
}

export interface RoadmapWithNodes {
  created_at: Timestamp;
  description: string | null;
  id: UUID;
  is_template: boolean;
  nodes: NormalizedRoadmapNode[];
  role_id: UUID;
  role_name: string;
  title: string;
  type: 'roadmap_based';
  user_id: UUID | null;
}

export interface ApiRoadmapResponse {
  created_at: Timestamp;
  description: string | null;
  id: UUID;
  is_template: boolean;
  nodes: ApiRoadmapNode[];
  role_id: UUID;
  role_name: string;
  title: string;
  user_id: UUID | null;
}

export interface RoadmapHeroData {
  allRoadmapsLabel: string;
  backHref: string;
  description: string;
  downloadLabel: string;
  progressHint: string;
  progressLabel: string;
  trackProgressLabel: string;
}

export interface RoadmapHeroCopy {
  allRoadmapsLabel: string;
  backHref: string;
  downloadLabel: string;
  progressHint: string;
  trackProgressLabel: string;
}

export interface RoadmapIntroCardItem {
  id: string;
  label: string;
  tone: 'green' | 'neutral' | 'pink';
  variant: 'check' | 'map';
}

export interface RoadmapIntroCardData {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  items: RoadmapIntroCardItem[];
  title: string;
}

export interface RoadmapPromoCardData {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  imageAlt: string;
  imageSrc: string;
  title: string;
}

export interface RoadmapGraphData {
  illustrationAlt: string;
  illustrationSrc: string;
  title: string;
}

export interface RoadmapNodePanelLink {
  id: string;
  label: string;
  typeLabel: string;
  url: string;
}

export interface RoadmapNodePanelSection {
  id: string;
  label: string;
  links: RoadmapNodePanelLink[];
  tone: 'blue' | 'green';
}

export interface RoadmapNodePanelTabContent {
  emptyLabel: string;
  sections: RoadmapNodePanelSection[];
}

export interface RoadmapNodePanelDetail {
  description: string;
  resources: RoadmapNodePanelTabContent;
  tutor: RoadmapNodePanelTabContent;
}

export interface RoadmapNodePanelData {
  aiTutorTabLabel: string;
  detailsByNodeId: Record<string, RoadmapNodePanelDetail>;
  resourcesTabLabel: string;
  statusLabels: Record<NodeStatus, string>;
}

export interface RoadmapTheme {
  connector: {
    dashOffsetStep: number;
    header: { dashArray: string; stroke: string; strokeWidth: number };
    main: { animationDuration: string; dashArray: string; stroke: string; strokeWidth: number };
    optional: {
      animationDuration: string;
      dashArray: string;
      stroke: string;
      strokeWidth: number;
    };
    required: {
      animationDuration: string;
      dashArray: string;
      stroke: string;
      strokeWidth: number;
    };
  };
  graph: {
    card: {
      borderRadius: string;
      maxWidth: string;
      paddingBottom: string;
      paddingTop: string;
      paddingX: string;
    };
    contentMaxWidth: string;
    illustration: {
      height: string;
      left: string;
      opacity: number;
      top: string;
      width: string;
    };
    row: { gap: string; minHeight: number; nodeWidth: string; paddingY: number };
    skill: {
      anchorOffset: string;
      gap: number;
      large: { minHeight: string; paddingX: string; paddingY: string };
      small: { minHeight: string; paddingX: string; paddingY: string };
      maxWidth: string;
      minWidth: string;
      pillHeight: number;
    };
    title: {
      background: string;
      bottomAnchorOffset: string;
      marginBottom: string;
      maxWidth: string;
      stemHeight: string;
      stemWidth: string;
      typography: {
        color: string;
        fontSize: string;
        letterSpacing: string;
        lineHeight: string;
        paddingX: string;
      };
    };
  };
  hero: {
    badge: {
      background: string;
      color: string;
      paddingX: string;
      paddingY: string;
      radius: string;
    };
    container: { gap: string; maxWidth: string; paddingX: string; paddingY: string };
    progressRow: { gap: string; hintGap: string; minHeight: string; metaGap: string };
    toolbar: {
      buttonHeight: string;
      buttonPaddingX: string;
      gap: string;
      iconButtonWidth: string;
      radius: string;
    };
    typography: {
      backlinkColor: string;
      bodyFontSize: string;
      descriptionColor: string;
      descriptionLineHeight: string;
      hintColor: string;
      progressFontSize: string;
      progressLineHeight: string;
      titleColor: string;
      titleLineHeight: string;
      titleSize: string;
      uiTextColor: string;
    };
  };
  introCard: {
    card: {
      background: string;
      borderRadius: string;
      insetBorder: string;
      maxWidth: string;
      padding: string;
      paddingX: string;
      paddingY: string;
    };
    illustration: {
      accentLineColor: string;
      branchLineColor: string;
      height: string;
      iconTop: string;
      itemHeight: number;
      itemOffsetTop: number;
      lineLeft: string;
      lineWidth: string;
      rowLineColor: string;
      textLeft: string;
      trackBottom: string;
      trackLeft: string;
    };
    layout: { columnGap: string; gridColumns: string };
    spacing: { contentGap: string; ctaPaddingX: string };
    typography: {
      bodyColor: string;
      bodyFontSize: string;
      bodyLineHeight: string;
      headingColor: string;
      headingLetterSpacing: string;
      headingLineHeight: string;
      headingSize: string;
      itemFontSize: string;
      itemLineHeight: string;
    };
  };
  icon: {
    introCheck: { green: string; pink: string };
    roadmapLink: { green: string; purple: string; shadow: string; size: string; stroke: string };
  };
  node: {
    main: {
      background: string;
      borderColor: string;
      borderRadius: string;
      borderWidth: string;
      height: string;
      paddingX: string;
      shadow: string;
      textColor: string;
      typography: { fontSize: string; lineHeight: string };
      width: string;
    };
    skill: {
      background: string;
      borderColor: string;
      borderRadius: string;
      borderWidth: string;
      shadow: string;
      textColor: string;
      typography: {
        large: { fontSize: string; lineHeight: string };
        letterSpacing: string;
        small: { fontSize: string; lineHeight: string };
      };
    };
  };
  panel: {
    closeButton: {
      background: string;
      borderColor: string;
      color: string;
      radius: string;
      size: string;
    };
    content: { gap: string; paddingX: string; paddingY: string };
    dividerColor: string;
    overlay: string;
    panel: {
      background: string;
      borderColor: string;
      borderWidth: string;
      shadow: string;
      width: string;
    };
    resourceTypeBadge: {
      background: string;
      color: string;
      paddingX: string;
      paddingY: string;
      radius: string;
    };
    sectionBadge: {
      blue: { background: string; color: string; borderColor: string };
      green: { background: string; color: string; borderColor: string };
      radius: string;
    };
    sectionPaddingTop: string;
    statusSelect: {
      background: string;
      borderColor: string;
      color: string;
      height: string;
      paddingX: string;
      radius: string;
    };
    tab: {
      activeBackground: string;
      activeBorderColor: string;
      activeColor: string;
      borderWidth: string;
      height: string;
      inactiveBackground: string;
      inactiveBorderColor: string;
      inactiveColor: string;
      paddingX: string;
      radius: string;
    };
    typography: {
      bodyColor: string;
      bodyFontSize: string;
      bodyLineHeight: string;
      linkColor: string;
      metaColor: string;
      titleColor: string;
      titleLetterSpacing: string;
      titleLineHeight: string;
      titleSize: string;
    };
  };
  page: {
    heroBackground: string;
    heroBackgroundHeight: string;
    mainPaddingTop: string;
    promoBackground: string;
    promoBlur: string;
    promoHighlight: { background: string; height: string; maxWidth: string; rotate: string };
    sectionGap: string;
    sectionPaddingBottom: string;
    sectionPaddingTop: string;
  };
  promoCard: {
    card: {
      background: string;
      borderColor: string;
      borderRadius: string;
      borderWidth: string;
      gridColumns: string;
      padding: string;
      shadow: string;
    };
    image: { dropShadow: string; height: string; maxWidth: string };
    typography: {
      bodyColor: string;
      headingColor: string;
      headingLetterSpacing: string;
      headingLineHeight: string;
      headingSize: string;
    };
  };
}

export interface RoadmapPageData {
  graph: RoadmapGraphData;
  hero: RoadmapHeroCopy;
  introCard: RoadmapIntroCardData;
  nodePanel: RoadmapNodePanelData;
  promoCard: RoadmapPromoCardData;
  theme: RoadmapTheme;
}

export interface RoadmapPageContentData {
  graph: RoadmapGraphData;
  hero: RoadmapHeroCopy;
  introCard: RoadmapIntroCardData;
  nodePanel: RoadmapNodePanelData;
  promoCard: RoadmapPromoCardData;
}

export interface NodeProgress {
  completed_at: Timestamp | null;
  roadmap_node_id: UUID;
  skill_id: UUID;
  skill_name: string;
  started_at: Timestamp | null;
  status: NodeStatus;
}

export interface RoadmapProgress {
  completed_nodes: number;
  completion_percentage: number;
  in_progress_nodes: number;
  nodes: NodeProgress[];
  roadmap_id: UUID;
  total_nodes: number;
}

export interface RoadmapWebModel {
  graphNodes: RoadmapGraphNode[];
  hero: RoadmapHeroData;
  progress: RoadmapProgress | null;
  roadmap: RoadmapWithNodes;
  ui: RoadmapPageData;
}

export interface Resource {
  id: UUID;
  is_free: boolean;
  level_tag: SkillLevel | null;
  platform: ResourcePlatform;
  skill_id: UUID;
  title: string;
  url: string;
}
