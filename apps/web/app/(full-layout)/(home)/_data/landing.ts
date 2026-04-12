import type {
  NavItem,
  RoadmapItemData,
  RoadmapTimelineItem,
} from '@/app/(full-layout)/(home)/_types/landing';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Explore roadmaps', href: '/' },
  { label: 'AI Tutor', href: '/ai' },
  { label: 'Categories', href: '/categories' },
  { label: 'Docs', href: '/docs' },
];

export const ROLE_BASED_ROADMAPS: RoadmapItemData[] = [
  { label: 'Frontend', href: '/roadmaps/frontend' },
  { label: 'Backend', href: '/roadmaps/backend' },
  { label: 'Full Stack', href: '/roadmaps/full-stack' },
  { label: 'DevOps', href: '/roadmaps/devops' },
  { label: 'DevSecOps', href: '/roadmaps/devsecops' },
  { label: 'Data Analyst', href: '/roadmaps/data-analyst' },
  { label: 'AI Engineer', href: '/roadmaps/ai-engineer' },
  { label: 'AI and Data Scientist', href: '/roadmaps/ai-data-scientist' },
  { label: 'Data Engineer', href: '/roadmaps/data-engineer' },
  { label: 'Android', href: '/roadmaps/android' },
  { label: 'Machine Learning', href: '/roadmaps/machine-learning' },
  { label: 'PostgreSQL', href: '/roadmaps/postgresql' },
  { label: 'iOS', href: '/roadmaps/ios' },
  { label: 'Blockchain', href: '/roadmaps/blockchain' },
  { label: 'QA', href: '/roadmaps/qa' },
  { label: 'Software Architect', href: '/roadmaps/software-architect' },
  { label: 'Cyber Security', href: '/roadmaps/cyber-security' },
  { label: 'UX Design', href: '/roadmaps/ux-design' },
  { label: 'Technical Writer', href: '/roadmaps/technical-writer' },
  { label: 'Game Developer', href: '/roadmaps/game-developer' },
  { label: 'Server Side Game Developer', href: '/roadmaps/server-side-game-developer' },
  { label: 'MLOps', href: '/roadmaps/mlops' },
  { label: 'Product Manager', href: '/roadmaps/product-manager' },
  { label: 'Engineering Manager', href: '/roadmaps/engineering-manager' },
  { label: 'Developer Relations', href: '/roadmaps/developer-relations' },
  { label: 'BI Analyst', href: '/roadmaps/bi-analyst' },
  { label: '+ Create your own Roadmap', href: '/create', variant: 'create' as const },
];

export const SKILL_BASED_ROADMAPS: RoadmapItemData[] = [
  { label: 'SQL', href: '/roadmaps/sql' },
  { label: 'Computer Science', href: '/roadmaps/computer-science' },
  { label: 'React', href: '/roadmaps/react' },
  { label: 'Vue', href: '/roadmaps/vue' },
  { label: 'Angular', href: '/roadmaps/angular' },
  { label: 'JavaScript', href: '/roadmaps/javascript' },
  { label: 'TypeScript', href: '/roadmaps/typescript' },
  { label: 'Node.js', href: '/roadmaps/nodejs' },
  { label: 'Python', href: '/roadmaps/python' },
  { label: 'System Design', href: '/roadmaps/system-design' },
  { label: 'Java', href: '/roadmaps/java' },
  { label: 'ASP.NET Core', href: '/roadmaps/asp' },
];

export const TIMELINE_ITEMS: RoadmapTimelineItem[] = [
  { title: 'Road to DevOps Engineer', iconType: 'map-pin', weight: 'semibold' },
  { title: 'Learn a Programming Language', iconType: 'circle', weight: 'medium' },
  { title: 'Operating System', iconType: 'circle', weight: 'medium' },
  { title: 'Terminal Knowledge', iconType: 'dot', weight: 'medium' },
  { title: 'Version Control Systems', iconType: 'dot', weight: 'medium' },
];
