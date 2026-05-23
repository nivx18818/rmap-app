import { PrismaClientKnownRequestError } from './prisma-namespace.mock';

export class PrismaClient {
  constructor(_options?: { adapter?: unknown }) {
    void _options;
  }

  $connect = jest.fn();
  $disconnect = jest.fn();
}

export const Prisma = {
  PrismaClientKnownRequestError,
};

export const RoleCategory = {
  WEB_DEVELOPMENT: 'WEB_DEVELOPMENT',
  FRAMEWORKS: 'FRAMEWORKS',
  ABSOLUTE_BEGINNERS: 'ABSOLUTE_BEGINNERS',
  LANGUAGES_AND_PLATFORMS: 'LANGUAGES_AND_PLATFORMS',
  DEVOPS: 'DEVOPS',
  DATABASES: 'DATABASES',
  COMPUTER_SCIENCE: 'COMPUTER_SCIENCE',
  DESIGN: 'DESIGN',
  BEST_PRACTICES: 'BEST_PRACTICES',
  AI_AND_MACHINE_LEARNING: 'AI_AND_MACHINE_LEARNING',
  DATA_ANALYSIS: 'DATA_ANALYSIS',
  MOBILE_DEVELOPMENT: 'MOBILE_DEVELOPMENT',
  MANAGEMENT: 'MANAGEMENT',
  GAME_DEVELOPMENT: 'GAME_DEVELOPMENT',
  BLOCKCHAIN: 'BLOCKCHAIN',
  CYBER_SECURITY: 'CYBER_SECURITY',
} as const;

export const NodeStatus = {
  LOCKED: 'LOCKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const NodeType = {
  GROUP: 'GROUP',
  MILESTONE: 'MILESTONE',
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
} as const;

export const ResourceType = {
  YOUTUBE: 'YOUTUBE',
  DOCS: 'DOCS',
  COURSE: 'COURSE',
  ARTICLE: 'ARTICLE',
} as const;

export const QuizGenerationStatus = {
  NOT_GENERATED: 'NOT_GENERATED',
  GENERATING: 'GENERATING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;
