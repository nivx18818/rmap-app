import type { RelationType, RoadmapNode, RoadmapRoot, SkillNode } from '@/types/roadmap';

const FRONTEND_ROLE_ID = '9d2ccf7a-4d7d-44ca-8a2c-4fd13e77d001';
const FRONTEND_ROADMAP_ID = '8d4de6f8-7a12-48fd-b4d7-cd2d5d94a001';
const CREATED_AT = '2026-04-07T00:00:00Z';

interface SkillSeed {
  estimated_hours?: number;
  name: string;
  slug: string;
}

interface NodeSeed {
  estimatedHours?: number;
  id: string;
  name: string;
  parentNodeId: string | null;
  relationType?: RelationType;
  skills?: SkillSeed[];
  sortOrder: number;
  slug: string;
}

function createSkillNode(nodeSlug: string, skill: SkillSeed, index: number): SkillNode {
  return {
    category: 'frontend',
    description: null,
    estimated_hours: skill.estimated_hours ?? null,
    id: `${nodeSlug}-skill-${index + 1}`,
    label: skill.name,
    name: skill.name,
    slug: skill.slug,
    type: 'skill_node',
  };
}

function createRoadmapNode(seed: NodeSeed): RoadmapNode {
  const skillId = `skill-${seed.slug}`;

  return {
    children: [],
    id: seed.id,
    label: seed.name,
    parent_node_id: seed.parentNodeId,
    relation_type: seed.relationType ?? 'required',
    roadmap_id: FRONTEND_ROADMAP_ID,
    skill_estimated_hours: seed.estimatedHours ?? null,
    skill_id: skillId,
    skill_name: seed.name,
    skills: (seed.skills ?? []).map((skill, index) => createSkillNode(seed.slug, skill, index)),
    sort_order: seed.sortOrder,
    type: 'roadmap_node',
  };
}

const FRONTEND_NODE_SEEDS: NodeSeed[] = [
  {
    estimatedHours: 18,
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Internet',
    parentNodeId: null,
    skills: [
      {
        estimated_hours: 6,
        name: 'How does the internet work?',
        slug: 'how-does-the-internet-work',
      },
      { estimated_hours: 4, name: 'What is HTTP?', slug: 'what-is-http' },
      { estimated_hours: 4, name: 'What is Browser?', slug: 'what-is-browser' },
      { estimated_hours: 4, name: 'DNS and how it works?', slug: 'dns-and-how-it-works' },
    ],
    slug: 'internet',
    sortOrder: 1,
  },
  {
    estimatedHours: 24,
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'HTML',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440001',
    skills: [
      { estimated_hours: 8, name: 'Learn the basics', slug: 'html-basics' },
      { estimated_hours: 8, name: 'Semantic HTML', slug: 'semantic-html' },
      { estimated_hours: 8, name: 'Forms and validations', slug: 'forms-and-validations' },
      { estimated_hours: 6, name: 'Accessibility basics', slug: 'accessibility-basics' },
    ],
    slug: 'html',
    sortOrder: 2,
  },
  {
    estimatedHours: 32,
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'CSS',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440002',
    skills: [
      { estimated_hours: 8, name: 'Learn the basics', slug: 'css-basics' },
      { estimated_hours: 10, name: 'Making layouts', slug: 'making-layouts' },
      { estimated_hours: 8, name: 'Responsive design', slug: 'responsive-design' },
      { estimated_hours: 6, name: 'Positioning', slug: 'positioning' },
    ],
    slug: 'css',
    sortOrder: 3,
  },
  {
    estimatedHours: 40,
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'JavaScript',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440003',
    skills: [
      { estimated_hours: 10, name: 'Syntax and fundamentals', slug: 'syntax-and-fundamentals' },
      { estimated_hours: 12, name: 'DOM manipulation', slug: 'dom-manipulation' },
      { estimated_hours: 10, name: 'Fetch API / AJAX', slug: 'fetch-api-ajax' },
      { estimated_hours: 8, name: 'ES6+ features', slug: 'es6-features' },
    ],
    slug: 'javascript',
    sortOrder: 4,
  },
  {
    estimatedHours: 18,
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Version Control Systems',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440004',
    skills: [
      { estimated_hours: 6, name: 'Git basics', slug: 'git-basics' },
      { estimated_hours: 6, name: 'Repositories', slug: 'repositories' },
      { estimated_hours: 6, name: 'Branching strategies', slug: 'branching-strategies' },
    ],
    slug: 'version-control-systems',
    sortOrder: 5,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'VCS Hosting',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440005',
    skills: [
      { estimated_hours: 4, name: 'GitHub', slug: 'github' },
      { estimated_hours: 4, name: 'GitLab', slug: 'gitlab' },
      { estimated_hours: 4, name: 'Bitbucket', slug: 'bitbucket' },
    ],
    slug: 'vcs-hosting',
    sortOrder: 6,
  },
  {
    estimatedHours: 10,
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Package Managers',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440006',
    skills: [
      { estimated_hours: 3, name: 'npm', slug: 'npm' },
      { estimated_hours: 3, name: 'pnpm', slug: 'pnpm' },
      { estimated_hours: 4, name: 'yarn', slug: 'yarn' },
    ],
    slug: 'package-managers',
    sortOrder: 7,
  },
  {
    estimatedHours: 20,
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Learn Framework',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440007',
    skills: [
      { estimated_hours: 8, name: 'Component-based thinking', slug: 'component-based-thinking' },
      { estimated_hours: 6, name: 'Routing', slug: 'routing' },
      { estimated_hours: 6, name: 'State management', slug: 'state-management' },
    ],
    slug: 'learn-framework',
    sortOrder: 8,
  },
  {
    estimatedHours: 24,
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Pick a Framework',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440008',
    skills: [
      { estimated_hours: 8, name: 'React', slug: 'react' },
      { estimated_hours: 8, name: 'Vue', slug: 'vue' },
      { estimated_hours: 8, name: 'Angular', slug: 'angular' },
    ],
    slug: 'pick-a-framework',
    sortOrder: 9,
  },
  {
    estimatedHours: 18,
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Modern CSS',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440009',
    skills: [
      { estimated_hours: 5, name: 'Tailwind CSS', slug: 'tailwind-css' },
      { estimated_hours: 4, name: 'CSS Modules', slug: 'css-modules' },
      { estimated_hours: 5, name: 'Styled Components', slug: 'styled-components' },
      { estimated_hours: 4, name: 'CSS-in-JS', slug: 'css-in-js' },
    ],
    slug: 'modern-css',
    sortOrder: 10,
  },
  {
    estimatedHours: 16,
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Build Tools',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440010',
    skills: [
      { estimated_hours: 4, name: 'Vite', slug: 'vite' },
      { estimated_hours: 4, name: 'Webpack', slug: 'webpack' },
      { estimated_hours: 4, name: 'Parcel', slug: 'parcel' },
      { estimated_hours: 4, name: 'esbuild', slug: 'esbuild' },
    ],
    slug: 'build-tools',
    sortOrder: 11,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'CSS Architecture',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440011',
    skills: [
      { estimated_hours: 5, name: 'BEM', slug: 'bem' },
      { estimated_hours: 4, name: 'OOCSS', slug: 'oocss' },
      { estimated_hours: 5, name: 'SMACSS', slug: 'smacss' },
    ],
    slug: 'css-architecture',
    sortOrder: 12,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'CSS Preprocessors',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440012',
    skills: [
      { estimated_hours: 4, name: 'Sass', slug: 'sass' },
      { estimated_hours: 4, name: 'PostCSS', slug: 'postcss' },
      { estimated_hours: 4, name: 'Less', slug: 'less' },
    ],
    slug: 'css-preprocessors',
    sortOrder: 13,
  },
  {
    estimatedHours: 18,
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'Testing your Apps',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440013',
    skills: [
      { estimated_hours: 4, name: 'Vitest', slug: 'vitest' },
      { estimated_hours: 4, name: 'Jest', slug: 'jest' },
      { estimated_hours: 5, name: 'Playwright', slug: 'playwright' },
      { estimated_hours: 5, name: 'Cypress', slug: 'cypress' },
    ],
    slug: 'testing-your-apps',
    sortOrder: 14,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440015',
    name: 'Type Checkers',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440014',
    skills: [
      { estimated_hours: 10, name: 'TypeScript', slug: 'typescript' },
      { estimated_hours: 4, name: 'ts-reset', slug: 'ts-reset' },
    ],
    slug: 'type-checkers',
    sortOrder: 15,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440016',
    name: 'Web Components',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440015',
    skills: [
      { estimated_hours: 4, name: 'HTML Templates', slug: 'html-templates' },
      { estimated_hours: 4, name: 'Custom Elements', slug: 'custom-elements' },
      { estimated_hours: 4, name: 'Shadow DOM', slug: 'shadow-dom' },
    ],
    slug: 'web-components',
    sortOrder: 16,
  },
  {
    estimatedHours: 16,
    id: '550e8400-e29b-41d4-a716-446655440017',
    name: 'SSR',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440016',
    skills: [
      { estimated_hours: 4, name: 'Next.js', slug: 'nextjs' },
      { estimated_hours: 4, name: 'Nuxt.js', slug: 'nuxtjs' },
      { estimated_hours: 4, name: 'Remix', slug: 'remix' },
      { estimated_hours: 4, name: 'Astro', slug: 'astro' },
    ],
    slug: 'ssr',
    sortOrder: 17,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440018',
    name: 'GraphQL',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440017',
    relationType: 'optional',
    skills: [
      { estimated_hours: 4, name: 'Queries', slug: 'queries' },
      { estimated_hours: 4, name: 'Mutations', slug: 'mutations' },
      { estimated_hours: 6, name: 'Apollo Client', slug: 'apollo-client' },
    ],
    slug: 'graphql',
    sortOrder: 18,
  },
  {
    estimatedHours: 10,
    id: '550e8400-e29b-41d4-a716-446655440019',
    name: 'Static Site Generators',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440018',
    relationType: 'optional',
    skills: [
      { estimated_hours: 3, name: 'Astro', slug: 'astro-ssg' },
      { estimated_hours: 3, name: 'Eleventy', slug: 'eleventy' },
      { estimated_hours: 4, name: 'Next.js SSG', slug: 'nextjs-ssg' },
    ],
    slug: 'static-site-generators',
    sortOrder: 19,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: 'Progressive Web Apps',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440019',
    relationType: 'optional',
    skills: [
      { estimated_hours: 4, name: 'Web App Manifest', slug: 'web-app-manifest' },
      { estimated_hours: 4, name: 'Offline support', slug: 'offline-support' },
      { estimated_hours: 4, name: 'Installable apps', slug: 'installable-apps' },
    ],
    slug: 'progressive-web-apps',
    sortOrder: 20,
  },
  {
    estimatedHours: 16,
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'Web Security',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440020',
    skills: [
      { estimated_hours: 4, name: 'CORS', slug: 'cors' },
      { estimated_hours: 4, name: 'HTTPS', slug: 'https' },
      { estimated_hours: 4, name: 'CSP', slug: 'csp' },
      { estimated_hours: 4, name: 'OWASP', slug: 'owasp' },
    ],
    slug: 'web-security',
    sortOrder: 21,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: 'Storage',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440021',
    skills: [
      { estimated_hours: 3, name: 'Local Storage', slug: 'local-storage' },
      { estimated_hours: 3, name: 'Session Storage', slug: 'session-storage' },
      { estimated_hours: 3, name: 'IndexedDB', slug: 'indexeddb' },
      { estimated_hours: 3, name: 'Cookies', slug: 'cookies' },
    ],
    slug: 'storage',
    sortOrder: 22,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440023',
    name: 'Accessibility',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440022',
    skills: [
      { estimated_hours: 4, name: 'ARIA', slug: 'aria' },
      { estimated_hours: 4, name: 'Keyboard navigation', slug: 'keyboard-navigation' },
      { estimated_hours: 3, name: 'Color contrast', slug: 'color-contrast' },
      { estimated_hours: 3, name: 'Screen reader support', slug: 'screen-reader-support' },
    ],
    slug: 'accessibility',
    sortOrder: 23,
  },
  {
    estimatedHours: 16,
    id: '550e8400-e29b-41d4-a716-446655440024',
    name: 'Modern APIs',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440023',
    relationType: 'optional',
    skills: [
      { estimated_hours: 4, name: 'REST', slug: 'rest' },
      { estimated_hours: 4, name: 'WebSockets', slug: 'websockets' },
      { estimated_hours: 4, name: 'Service Workers', slug: 'service-workers' },
      { estimated_hours: 4, name: 'Geolocation', slug: 'geolocation' },
    ],
    slug: 'modern-apis',
    sortOrder: 24,
  },
  {
    estimatedHours: 10,
    id: '550e8400-e29b-41d4-a716-446655440025',
    name: 'Linters / Formatters',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440024',
    skills: [
      { estimated_hours: 3, name: 'ESLint', slug: 'eslint' },
      { estimated_hours: 3, name: 'Prettier', slug: 'prettier' },
      { estimated_hours: 4, name: 'Stylelint', slug: 'stylelint' },
    ],
    slug: 'linters-formatters',
    sortOrder: 25,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440026',
    name: 'Module Bundlers',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440025',
    skills: [
      { estimated_hours: 4, name: 'Webpack', slug: 'webpack-bundler' },
      { estimated_hours: 4, name: 'Rollup', slug: 'rollup' },
      { estimated_hours: 6, name: 'Vite internals', slug: 'vite-internals' },
    ],
    slug: 'module-bundlers',
    sortOrder: 26,
  },
  {
    estimatedHours: 14,
    id: '550e8400-e29b-41d4-a716-446655440027',
    name: 'Authentication Strategies',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440026',
    relationType: 'optional',
    skills: [
      { estimated_hours: 4, name: 'JWT', slug: 'jwt' },
      { estimated_hours: 3, name: 'Session auth', slug: 'session-auth' },
      { estimated_hours: 4, name: 'OAuth', slug: 'oauth' },
      { estimated_hours: 3, name: 'SSO', slug: 'sso' },
    ],
    slug: 'authentication-strategies',
    sortOrder: 27,
  },
  {
    estimatedHours: 12,
    id: '550e8400-e29b-41d4-a716-446655440028',
    name: 'Web Performance',
    parentNodeId: '550e8400-e29b-41d4-a716-446655440027',
    skills: [
      { estimated_hours: 3, name: 'Core Web Vitals', slug: 'core-web-vitals' },
      { estimated_hours: 3, name: 'Lighthouse', slug: 'lighthouse' },
      { estimated_hours: 3, name: 'Code splitting', slug: 'code-splitting' },
      { estimated_hours: 3, name: 'Lazy loading', slug: 'lazy-loading' },
    ],
    slug: 'web-performance',
    sortOrder: 28,
  },
];

const FRONTEND_NODES: RoadmapNode[] = FRONTEND_NODE_SEEDS.map(createRoadmapNode);

export const FRONTEND_ROADMAP: RoadmapRoot = {
  roadmaps: {
    created_at: CREATED_AT,
    description: 'Step by step guide to becoming a modern frontend developer in 2026.',
    id: FRONTEND_ROADMAP_ID,
    is_template: true,
    nodes: FRONTEND_NODES,
    role_id: FRONTEND_ROLE_ID,
    role_name: 'Frontend Developer',
    title: 'Frontend',
    type: 'roadmap_based',
    user_id: null,
  },
};
