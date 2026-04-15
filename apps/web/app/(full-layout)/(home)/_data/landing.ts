import type {
  NavItem,
  RoadmapItemData,
  RoadmapTimelineItem,
} from '@/app/(full-layout)/(home)/_types/landing';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Explore roadmaps', href: '/' },
  { label: 'Generate personalized roadmap', href: '/ai' },
];

export const ROLE_BASED_ROADMAPS: RoadmapItemData[] = [
  { label: 'Frontend', href: '/roadmaps/frontend' },
  { label: 'Backend', href: '/roadmaps/backend' },
  { label: 'Full Stack', href: '/roadmaps/full-stack' },
  { label: 'DevOps', href: '/roadmaps/devops' },
  { label: 'Data Analyst', href: '/roadmaps/data-analyst' },
  { label: 'DevSecOps (Coming soon)', href: '/roadmaps/devsecops', isComingSoon: true },
  { label: 'AI Engineer (Coming soon)', href: '/roadmaps/ai-engineer', isComingSoon: true },
  {
    label: 'AI and Data Scientist (Coming soon)',
    href: '/roadmaps/ai-data-scientist',
    isComingSoon: true,
  },
  { label: 'Data Engineer (Coming soon)', href: '/roadmaps/data-engineer', isComingSoon: true },
  { label: 'Android (Coming soon)', href: '/roadmaps/android', isComingSoon: true },
  {
    label: 'Machine Learning (Coming soon)',
    href: '/roadmaps/machine-learning',
    isComingSoon: true,
  },
  { label: 'PostgreSQL (Coming soon)', href: '/roadmaps/postgresql', isComingSoon: true },
  { label: 'iOS (Coming soon)', href: '/roadmaps/ios', isComingSoon: true },
  { label: 'Blockchain (Coming soon)', href: '/roadmaps/blockchain', isComingSoon: true },
  { label: 'QA (Coming soon)', href: '/roadmaps/qa', isComingSoon: true },
  {
    label: 'Software Architect (Coming soon)',
    href: '/roadmaps/software-architect',
    isComingSoon: true,
  },
  { label: 'Cyber Security (Coming soon)', href: '/roadmaps/cyber-security', isComingSoon: true },
  { label: 'UX Design (Coming soon)', href: '/roadmaps/ux-design', isComingSoon: true },
  {
    label: 'Technical Writer (Coming soon)',
    href: '/roadmaps/technical-writer',
    isComingSoon: true,
  },
  { label: 'Game Developer (Coming soon)', href: '/roadmaps/game-developer', isComingSoon: true },
  {
    label: 'Server Side Game Developer (Coming soon)',
    href: '/roadmaps/server-side-game-developer',
    isComingSoon: true,
  },
  { label: 'MLOps (Coming soon)', href: '/roadmaps/mlops', isComingSoon: true },
  { label: 'Product Manager (Coming soon)', href: '/roadmaps/product-manager', isComingSoon: true },
  {
    label: 'Engineering Manager (Coming soon)',
    href: '/roadmaps/engineering-manager',
    isComingSoon: true,
  },
  {
    label: 'Developer Relations (Coming soon)',
    href: '/roadmaps/developer-relations',
    isComingSoon: true,
  },
  { label: 'BI Analyst (Coming soon)', href: '/roadmaps/bi-analyst', isComingSoon: true },
  { label: '+ Create your own Roadmap', href: '/ai', variant: 'create' as const },
];

export const SKILL_BASED_ROADMAPS: RoadmapItemData[] = [
  { label: 'SQL', href: '/roadmaps/sql' },
  { label: 'Computer Science', href: '/roadmaps/computer-science' },
  { label: 'React', href: '/roadmaps/react' },
  { label: 'Vue', href: '/roadmaps/vue' },
  { label: 'Angular', href: '/roadmaps/angular' },
  { label: 'JavaScript', href: '/roadmaps/javascript' },
  { label: 'TypeScript (Coming soon)', href: '/roadmaps/typescript', isComingSoon: true },
  { label: 'Node.js (Coming soon)', href: '/roadmaps/nodejs', isComingSoon: true },
  { label: 'Python (Coming soon)', href: '/roadmaps/python', isComingSoon: true },
  { label: 'System Design (Coming soon)', href: '/roadmaps/system-design', isComingSoon: true },
  { label: 'Java (Coming soon)', href: '/roadmaps/java', isComingSoon: true },
  { label: 'ASP.NET Core (Coming soon)', href: '/roadmaps/asp', isComingSoon: true },
];

export const TIMELINE_ITEMS: RoadmapTimelineItem[] = [
  { title: 'Road to DevOps Engineer', iconType: 'map-pin', weight: 'semibold' },
  { title: 'Learn a Programming Language', iconType: 'circle', weight: 'medium' },
  { title: 'Operating System', iconType: 'circle', weight: 'medium' },
  { title: 'Terminal Knowledge', iconType: 'dot', weight: 'medium' },
  { title: 'Version Control Systems', iconType: 'dot', weight: 'medium' },
];
