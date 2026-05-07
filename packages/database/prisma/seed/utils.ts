import { RoleCategory } from '../../generated/prisma/enums';

export const ROADMAP_TITLES = {
  // ABSOLUTE BEGINNERS
  FRONTEND_BEGINNER: 'Frontend Beginner',
  BACKEND_BEGINNER: 'Backend Beginner',
  DEVOPS_BEGINNER: 'DevOps Beginner',
  GIT_GITHUB_BEGINNER: 'Git GitHub Beginner',

  // WEB DEVELOPMENT
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  FULL_STACK: 'Full Stack',
  DEVOPS: 'DevOps',
  QA: 'QA',
  API_DESIGN: 'API Design',
  GRAPHQL: 'GraphQL',
  GIT_GITHUB: 'Git GitHub',
  WORDPRESS: 'WordPress',

  // LANGUAGES
  SQL: 'SQL',
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  NODEJS: 'Node.js',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  RUST: 'Rust',
  GO: 'Go',
  PHP: 'PHP',
  KOTLIN: 'Kotlin',
  HTML: 'HTML',
  CSS: 'CSS',
  SWIFT_UI: 'Swift UI',
  SHELL_BASH: 'Shell Bash',
  RUBY: 'Ruby',

  // FRAMEWORKS
  REACT: 'React',
  VUE: 'Vue',
  ANGULAR: 'Angular',
  ASP_NET_CORE: 'ASP.NET Core',
  SPRING_BOOT: 'Spring Boot',
  NEXTJS: 'Next.js',
  LARAVEL: 'Laravel',
  DJANGO: 'Django',
  RUBY_ON_RAILS: 'Ruby On Rails',

  // DEVOPS
  DEVSECOPS: 'DevSecOps',
  LINUX: 'Linux',
  KUBERNETES: 'Kubernetes',
  DOCKER: 'Docker',
  AWS: 'AWS',
  TERRAFORM: 'Terraform',
  CLOUDFLARE: 'Cloudflare',

  // DATABASES
  POSTGRESQL: 'PostgreSQL',
  MONGODB: 'MongoDB',
  REDIS: 'Redis',
  ELASTICSEARCH: 'Elasticsearch',

  // COMPUTER SCIENCE
  COMPUTER_SCIENCE: 'Computer Science',
  SYSTEM_DESIGN: 'System Design',
  SOFTWARE_ARCHITECT: 'Software Architect',
  DESIGN_ARCHITECTURE: 'Design Architecture',
  TECHNICAL_WRITER: 'Technical Writer',
  DSA: 'Data Structures And Algorithms',
  DEV_REL: 'Developer Relations',
  LEETCODE: 'LeetCode',

  // DESIGN
  UX_DESIGN: 'UX Design',
  DESIGN_SYSTEM: 'Design System',

  // BEST PRACTICES
  API_SECURITY: 'API Security',
  BACKEND_PERFORMANCE: 'Backend Performance',
  FRONTEND_PERFORMANCE: 'Frontend Performance',
  CODE_REVIEW: 'Code Review',

  // DATA ANALYSIS
  DATA_ANALYST: 'Data Analyst',
  AI_DATA_SCIENTIST: 'AI and Data Scientist',
  BI_ANALYST: 'BI Analyst',

  // AI & ML
  AI_ENGINEER: 'AI Engineer',
  DATA_ENGINEER: 'Data Engineer',
  MACHINE_LEARNING: 'Machine Learning',
  PROMPT_ENGINEERING: 'Prompt Engineering',
  MLOPS: 'MLOps',
  AI_RED_TEAMING: 'AI Red Teaming',
  AI_AGENTS: 'AI Agents',
  CLAUDE_CODE: 'Claude Code',
  VIBE_CODING: 'Vibe Coding',
  OPENCLAW: 'OpenClaw',

  // MOBILE
  ANDROID: 'Android',
  IOS: 'iOS',
  FLUTTER: 'Flutter',
  REACT_NATIVE: 'React Native',

  // MANAGEMENT
  PRODUCT_MANAGER: 'Product Manager',
  ENGINEERING_MANAGER: 'Engineering Manager',

  // GAME
  GAME_BACKEND: 'Game Backend',
  GAME_DEVELOPER: 'Game Developer',
  GAME_SERVER: 'Server Side Game Developer',

  // OTHER
  BLOCKCHAIN: 'Blockchain',
  CYBER_SECURITY: 'Cyber Security',
} as const;

export type RoadmapTitle = (typeof ROADMAP_TITLES)[keyof typeof ROADMAP_TITLES];

export const ROADMAP_CATEGORY_MAP: Record<RoadmapTitle, RoleCategory> = {
  // ABSOLUTE BEGINNERS
  [ROADMAP_TITLES.FRONTEND_BEGINNER]: RoleCategory.ABSOLUTE_BEGINNERS,
  [ROADMAP_TITLES.BACKEND_BEGINNER]: RoleCategory.ABSOLUTE_BEGINNERS,
  [ROADMAP_TITLES.DEVOPS_BEGINNER]: RoleCategory.ABSOLUTE_BEGINNERS,
  [ROADMAP_TITLES.GIT_GITHUB_BEGINNER]: RoleCategory.ABSOLUTE_BEGINNERS,

  // WEB DEVELOPMENT
  [ROADMAP_TITLES.FRONTEND]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.BACKEND]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.FULL_STACK]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.DEVOPS]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.QA]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.API_DESIGN]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.GRAPHQL]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.GIT_GITHUB]: RoleCategory.WEB_DEVELOPMENT,
  [ROADMAP_TITLES.WORDPRESS]: RoleCategory.WEB_DEVELOPMENT,

  // LANGUAGES
  [ROADMAP_TITLES.SQL]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.JAVASCRIPT]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.TYPESCRIPT]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.NODEJS]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.PYTHON]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.JAVA]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.CPP]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.RUST]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.GO]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.PHP]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.KOTLIN]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.HTML]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.CSS]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.SWIFT_UI]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.SHELL_BASH]: RoleCategory.LANGUAGES_AND_PLATFORMS,
  [ROADMAP_TITLES.RUBY]: RoleCategory.LANGUAGES_AND_PLATFORMS,

  // FRAMEWORKS
  [ROADMAP_TITLES.REACT]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.VUE]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.ANGULAR]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.ASP_NET_CORE]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.SPRING_BOOT]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.NEXTJS]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.LARAVEL]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.DJANGO]: RoleCategory.FRAMEWORKS,
  [ROADMAP_TITLES.RUBY_ON_RAILS]: RoleCategory.FRAMEWORKS,

  // DEVOPS
  [ROADMAP_TITLES.DEVSECOPS]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.LINUX]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.KUBERNETES]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.DOCKER]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.AWS]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.TERRAFORM]: RoleCategory.DEVOPS,
  [ROADMAP_TITLES.CLOUDFLARE]: RoleCategory.DEVOPS,

  // DATABASES
  [ROADMAP_TITLES.POSTGRESQL]: RoleCategory.DATABASES,
  [ROADMAP_TITLES.MONGODB]: RoleCategory.DATABASES,
  [ROADMAP_TITLES.REDIS]: RoleCategory.DATABASES,
  [ROADMAP_TITLES.ELASTICSEARCH]: RoleCategory.DATABASES,

  // COMPUTER SCIENCE
  [ROADMAP_TITLES.COMPUTER_SCIENCE]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.SYSTEM_DESIGN]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.SOFTWARE_ARCHITECT]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.DESIGN_ARCHITECTURE]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.TECHNICAL_WRITER]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.DSA]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.DEV_REL]: RoleCategory.COMPUTER_SCIENCE,
  [ROADMAP_TITLES.LEETCODE]: RoleCategory.COMPUTER_SCIENCE,

  // DESIGN
  [ROADMAP_TITLES.UX_DESIGN]: RoleCategory.DESIGN,
  [ROADMAP_TITLES.DESIGN_SYSTEM]: RoleCategory.DESIGN,

  // BEST PRACTICES
  [ROADMAP_TITLES.API_SECURITY]: RoleCategory.BEST_PRACTICES,
  [ROADMAP_TITLES.BACKEND_PERFORMANCE]: RoleCategory.BEST_PRACTICES,
  [ROADMAP_TITLES.FRONTEND_PERFORMANCE]: RoleCategory.BEST_PRACTICES,
  [ROADMAP_TITLES.CODE_REVIEW]: RoleCategory.BEST_PRACTICES,

  // DATA
  [ROADMAP_TITLES.DATA_ANALYST]: RoleCategory.DATA_ANALYSIS,
  [ROADMAP_TITLES.AI_DATA_SCIENTIST]: RoleCategory.DATA_ANALYSIS,
  [ROADMAP_TITLES.BI_ANALYST]: RoleCategory.DATA_ANALYSIS,

  // AI
  [ROADMAP_TITLES.AI_ENGINEER]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.DATA_ENGINEER]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.MACHINE_LEARNING]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.PROMPT_ENGINEERING]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.MLOPS]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.AI_RED_TEAMING]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.AI_AGENTS]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.CLAUDE_CODE]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.VIBE_CODING]: RoleCategory.AI_AND_MACHINE_LEARNING,
  [ROADMAP_TITLES.OPENCLAW]: RoleCategory.AI_AND_MACHINE_LEARNING,

  // MOBILE
  [ROADMAP_TITLES.ANDROID]: RoleCategory.MOBILE_DEVELOPMENT,
  [ROADMAP_TITLES.IOS]: RoleCategory.MOBILE_DEVELOPMENT,
  [ROADMAP_TITLES.FLUTTER]: RoleCategory.MOBILE_DEVELOPMENT,
  [ROADMAP_TITLES.REACT_NATIVE]: RoleCategory.MOBILE_DEVELOPMENT,

  // MANAGEMENT
  [ROADMAP_TITLES.PRODUCT_MANAGER]: RoleCategory.MANAGEMENT,
  [ROADMAP_TITLES.ENGINEERING_MANAGER]: RoleCategory.MANAGEMENT,

  // GAME
  [ROADMAP_TITLES.GAME_BACKEND]: RoleCategory.GAME_DEVELOPMENT,
  [ROADMAP_TITLES.GAME_DEVELOPER]: RoleCategory.GAME_DEVELOPMENT,
  [ROADMAP_TITLES.GAME_SERVER]: RoleCategory.GAME_DEVELOPMENT,

  // OTHER
  [ROADMAP_TITLES.BLOCKCHAIN]: RoleCategory.BLOCKCHAIN,
  [ROADMAP_TITLES.CYBER_SECURITY]: RoleCategory.CYBER_SECURITY,
};

export const NORMALIZE_ROADMAP_TITLE: Record<string, string> = {
  ai: 'AI',
  api: 'API',
  aws: 'AWS',
  devops: 'DevOps',
  wordpress: 'WordPress',
  sql: 'SQL',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  php: 'PHP',
  ui: 'UI',
  ux: 'UX',
  html: 'HTML',
  css: 'CSS',
  aspnet: 'ASP.NET',
  nextjs: 'Next.js',
  devsecops: 'DevSecOps',
  db: 'DB',
  leetcode: 'LeetCode',
  ba: 'BA',
  bi: 'BI',
  mlops: 'MLOps',
  ios: 'iOS',
  ql: 'QL',
  qa: 'QA',
};

// Direct slug → RoleCategory map for roadmaps with tricky slugs that don't
// round-trip cleanly through the slugToTitle → ROADMAP_CATEGORY_MAP path.
export const SLUG_TO_CATEGORY: Record<string, RoleCategory> = {
  // WEB_DEVELOPMENT
  frontend: RoleCategory.WEB_DEVELOPMENT,
  backend: RoleCategory.WEB_DEVELOPMENT,
  'full-stack': RoleCategory.WEB_DEVELOPMENT,
  devops: RoleCategory.WEB_DEVELOPMENT,
  qa: RoleCategory.WEB_DEVELOPMENT,
  'api-design': RoleCategory.WEB_DEVELOPMENT,
  graphql: RoleCategory.WEB_DEVELOPMENT,
  'git-github': RoleCategory.WEB_DEVELOPMENT,
  wordpress: RoleCategory.WEB_DEVELOPMENT,
  // ABSOLUTE_BEGINNERS
  'frontend-beginner': RoleCategory.ABSOLUTE_BEGINNERS,
  'backend-beginner': RoleCategory.ABSOLUTE_BEGINNERS,
  'devops-beginner': RoleCategory.ABSOLUTE_BEGINNERS,
  'git-github-beginner': RoleCategory.ABSOLUTE_BEGINNERS,
  // LANGUAGES_AND_PLATFORMS
  sql: RoleCategory.LANGUAGES_AND_PLATFORMS,
  javascript: RoleCategory.LANGUAGES_AND_PLATFORMS,
  typescript: RoleCategory.LANGUAGES_AND_PLATFORMS,
  nodejs: RoleCategory.LANGUAGES_AND_PLATFORMS,
  python: RoleCategory.LANGUAGES_AND_PLATFORMS,
  java: RoleCategory.LANGUAGES_AND_PLATFORMS,
  cpp: RoleCategory.LANGUAGES_AND_PLATFORMS,
  rust: RoleCategory.LANGUAGES_AND_PLATFORMS,
  golang: RoleCategory.LANGUAGES_AND_PLATFORMS,
  php: RoleCategory.LANGUAGES_AND_PLATFORMS,
  kotlin: RoleCategory.LANGUAGES_AND_PLATFORMS,
  html: RoleCategory.LANGUAGES_AND_PLATFORMS,
  css: RoleCategory.LANGUAGES_AND_PLATFORMS,
  'swift-ui': RoleCategory.LANGUAGES_AND_PLATFORMS,
  'shell-bash': RoleCategory.LANGUAGES_AND_PLATFORMS,
  ruby: RoleCategory.LANGUAGES_AND_PLATFORMS,
  scala: RoleCategory.LANGUAGES_AND_PLATFORMS,
  // FRAMEWORKS
  react: RoleCategory.FRAMEWORKS,
  vue: RoleCategory.FRAMEWORKS,
  angular: RoleCategory.FRAMEWORKS,
  'aspnet-core': RoleCategory.FRAMEWORKS,
  'spring-boot': RoleCategory.FRAMEWORKS,
  nextjs: RoleCategory.FRAMEWORKS,
  laravel: RoleCategory.FRAMEWORKS,
  django: RoleCategory.FRAMEWORKS,
  'ruby-on-rails': RoleCategory.FRAMEWORKS,
  flutter: RoleCategory.FRAMEWORKS,
  'react-native': RoleCategory.FRAMEWORKS,
  // DEVOPS
  devsecops: RoleCategory.DEVOPS,
  linux: RoleCategory.DEVOPS,
  kubernetes: RoleCategory.DEVOPS,
  docker: RoleCategory.DEVOPS,
  aws: RoleCategory.DEVOPS,
  terraform: RoleCategory.DEVOPS,
  cloudflare: RoleCategory.DEVOPS,
  // DATABASES
  postgresql: RoleCategory.DATABASES,
  mongodb: RoleCategory.DATABASES,
  redis: RoleCategory.DATABASES,
  elasticsearch: RoleCategory.DATABASES,
  // COMPUTER_SCIENCE
  'computer-science': RoleCategory.COMPUTER_SCIENCE,
  'system-design': RoleCategory.COMPUTER_SCIENCE,
  'software-architect': RoleCategory.COMPUTER_SCIENCE,
  'software-design-architecture': RoleCategory.COMPUTER_SCIENCE,
  'technical-writer': RoleCategory.COMPUTER_SCIENCE,
  'datastructures-and-algorithms': RoleCategory.COMPUTER_SCIENCE,
  devrel: RoleCategory.COMPUTER_SCIENCE,
  leetcode: RoleCategory.COMPUTER_SCIENCE,
  // DESIGN
  'ux-design': RoleCategory.DESIGN,
  'design-system': RoleCategory.DESIGN,
  // BEST_PRACTICES
  'api-security': RoleCategory.BEST_PRACTICES,
  'backend-performance': RoleCategory.BEST_PRACTICES,
  'frontend-performance': RoleCategory.BEST_PRACTICES,
  'code-review': RoleCategory.BEST_PRACTICES,
  // DATA_ANALYSIS
  'data-analyst': RoleCategory.DATA_ANALYSIS,
  'ai-data-scientist': RoleCategory.DATA_ANALYSIS,
  'bi-analyst': RoleCategory.DATA_ANALYSIS,
  // AI_AND_MACHINE_LEARNING
  'ai-engineer': RoleCategory.AI_AND_MACHINE_LEARNING,
  'data-engineer': RoleCategory.AI_AND_MACHINE_LEARNING,
  'machine-learning': RoleCategory.AI_AND_MACHINE_LEARNING,
  'prompt-engineering': RoleCategory.AI_AND_MACHINE_LEARNING,
  mlops: RoleCategory.AI_AND_MACHINE_LEARNING,
  'ai-red-teaming': RoleCategory.AI_AND_MACHINE_LEARNING,
  'ai-agents': RoleCategory.AI_AND_MACHINE_LEARNING,
  'claude-code': RoleCategory.AI_AND_MACHINE_LEARNING,
  'vibe-coding': RoleCategory.AI_AND_MACHINE_LEARNING,
  openclaw: RoleCategory.AI_AND_MACHINE_LEARNING,
  'ai-product-builder': RoleCategory.AI_AND_MACHINE_LEARNING,
  // MOBILE_DEVELOPMENT
  android: RoleCategory.MOBILE_DEVELOPMENT,
  ios: RoleCategory.MOBILE_DEVELOPMENT,
  // MANAGEMENT
  'product-manager': RoleCategory.MANAGEMENT,
  'engineering-manager': RoleCategory.MANAGEMENT,
  // GAME_DEVELOPMENT
  'game-developer': RoleCategory.GAME_DEVELOPMENT,
  'server-side-game-developer': RoleCategory.GAME_DEVELOPMENT,
  // OTHER
  blockchain: RoleCategory.BLOCKCHAIN,
  'cyber-security': RoleCategory.CYBER_SECURITY,
};

export function normalizeRoadmapTitle(input: string): string {
  let result = input;

  for (const [key, value] of Object.entries(NORMALIZE_ROADMAP_TITLE)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}

export function slugToTitle(slug: string): string {
  const words = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  return normalizeRoadmapTitle(words.join(' '));
}

export function getRoleCategoryForSlug(slug: string): RoleCategory {
  const direct = SLUG_TO_CATEGORY[slug];
  if (direct) return direct;

  const title = slugToTitle(slug);
  const category = ROADMAP_CATEGORY_MAP[title as RoadmapTitle];
  if (!category) {
    // Fallback to computer science for unknown
    return RoleCategory.COMPUTER_SCIENCE;
  }
  return category;
}

export type ResourceType = 'YOUTUBE' | 'DOCS' | 'COURSE' | 'ARTICLE';

export interface ParsedResource {
  title: string;
  url: string;
  resource_type: ResourceType;
}

export interface ParsedSkill {
  id: string;
  name: string;
  description: string;
  role_category: RoleCategory;
  resources: ParsedResource[];
}

export function mapResourceType(rawType: string): ResourceType | null {
  const t = rawType.toLowerCase();
  if (t.includes('video') || t.includes('youtube')) return 'YOUTUBE';
  if (t.includes('course')) return 'COURSE';
  if (t.includes('doc') || t.includes('official')) return 'DOCS';
  if (t.includes('article')) return 'ARTICLE';
  return null;
}
