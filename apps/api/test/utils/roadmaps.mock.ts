import { RoleCategory } from '@repo/db/prisma/client';

import type { GenerateRoadmapDto } from '@/modules/roadmaps/dto/generate-roadmap.dto';
import type { AiRoadmapOutput, FlatNode } from '@/modules/roadmaps/types/ai-roadmap.types';

export const MOCK_USER_ID = 'user-uuid-1234';

export const MOCK_DTO: GenerateRoadmapDto = {
  goal: 'Backend Engineer at a product company',
  roleCategory: RoleCategory.BACKEND,
  hoursPerDay: 3,
  deadlineDate: '2030-12-31',
  quizAnswers: [
    {
      question: 'What is your current backend experience level?',
      answer: 'Beginner to intermediate, with basic JavaScript and API knowledge',
    },
    {
      question: 'Which backend skills should your roadmap focus on?',
      answer: 'REST APIs, authentication, databases, validation, error handling, and testing',
    },
    {
      question: 'Which runtime or framework do you want to learn for backend development?',
      answer: 'Node.js with NestJS',
    },
    {
      question: 'Should the roadmap include database and ORM skills?',
      answer: 'Yes, include SQL, relational database design, Prisma, and migrations',
    },
    {
      question: 'Should the roadmap include product-company engineering practices?',
      answer: 'Yes, include clean code, Git workflow, API documentation, logging, and debugging',
    },
    {
      question: 'Should the roadmap include deployment and infrastructure basics?',
      answer:
        'Yes, include environment variables, Docker basics, CI basics, and cloud deployment concepts',
    },
    {
      question: 'What kind of portfolio project should the roadmap lead to?',
      answer:
        'A production-style backend API with authentication, CRUD features, database integration, tests, and documentation',
    },
  ],
};

export const MOCK_SKILL_MAP = [
  { id: 'skill-1', name: 'HTTP & REST', defaultEstimatedHours: 6 },
  { id: 'skill-2', name: 'Node.js Basics', defaultEstimatedHours: 10 },
  { id: 'skill-3', name: 'NestJS Framework', defaultEstimatedHours: 15 },
  { id: 'skill-4', name: 'PostgreSQL', defaultEstimatedHours: 8 },
  { id: 'skill-5', name: 'Prisma ORM', defaultEstimatedHours: 10 },
  { id: 'skill-6', name: 'Authentication (JWT)', defaultEstimatedHours: 12 },
  { id: 'skill-7', name: 'Clean Code Practices', defaultEstimatedHours: 5 },
  { id: 'skill-8', name: 'Git Workflow', defaultEstimatedHours: 4 },
  { id: 'skill-9', name: 'Docker Basics', defaultEstimatedHours: 8 },
  { id: 'skill-10', name: 'CI/CD Basics', defaultEstimatedHours: 10 },
  { id: 'skill-11', name: 'API Documentation (Swagger)', defaultEstimatedHours: 6 },
  { id: 'skill-12', name: 'Error Handling', defaultEstimatedHours: 5 },
  { id: 'skill-13', name: 'Unit Testing (Jest)', defaultEstimatedHours: 12 },
];

export const MOCK_SKILL_PREREQUISITES = [
  {
    skillId: 'skill-2',
    skillName: 'Node.js Basics',
    prerequisiteSkillId: 'skill-1',
    prerequisiteSkillName: 'HTTP & REST',
  },
  {
    skillId: 'skill-3',
    skillName: 'NestJS Framework',
    prerequisiteSkillId: 'skill-2',
    prerequisiteSkillName: 'Node.js Basics',
  },
  {
    skillId: 'skill-5',
    skillName: 'Prisma ORM',
    prerequisiteSkillId: 'skill-4',
    prerequisiteSkillName: 'PostgreSQL',
  },
  {
    skillId: 'skill-6',
    skillName: 'Authentication (JWT)',
    prerequisiteSkillId: 'skill-3',
    prerequisiteSkillName: 'NestJS Framework',
  },
];

export const MOCK_PRISMA_SKILL_PREREQUISITES = MOCK_SKILL_PREREQUISITES.map((p) => ({
  skillId: p.skillId,
  prerequisiteSkillId: p.prerequisiteSkillId,
  skill: { name: p.skillName },
  prerequisiteSkill: { name: p.prerequisiteSkillName },
}));

export const MOCK_AI_ROADMAP: AiRoadmapOutput = {
  title: 'Backend Engineer Roadmap',
  description: 'A comprehensive plan tailored to Node.js, NestJS, and production practices.',
  nodes: [
    {
      name: 'Backend Foundations',
      nodeType: 'group',
      children: [
        { name: 'HTTP & REST', nodeType: 'required', skillId: 'skill-1', estimatedHours: 6 },
        { name: 'Node.js Basics', nodeType: 'required', skillId: 'skill-2', estimatedHours: 10 },
        { name: 'NestJS Framework', nodeType: 'required', skillId: 'skill-3', estimatedHours: 15 },
        { name: 'Error Handling', nodeType: 'optional', skillId: 'skill-12', estimatedHours: 5 },
      ],
    },
    {
      name: 'Database & ORM',
      nodeType: 'group',
      children: [
        { name: 'PostgreSQL', nodeType: 'required', skillId: 'skill-4', estimatedHours: 8 },
        { name: 'Prisma ORM', nodeType: 'required', skillId: 'skill-5', estimatedHours: 10 },
      ],
    },
    {
      name: 'Capstone: REST API',
      nodeType: 'milestone',
      description: 'Build a fully functional REST API with NestJS and PostgreSQL.',
    },
    {
      name: 'Advanced Engineering',
      nodeType: 'group',
      children: [
        {
          name: 'Authentication (JWT)',
          nodeType: 'required',
          skillId: 'skill-6',
          estimatedHours: 12,
        },
        {
          name: 'API Documentation (Swagger)',
          nodeType: 'optional',
          skillId: 'skill-11',
          estimatedHours: 6,
        },
        {
          name: 'Unit Testing (Jest)',
          nodeType: 'required',
          skillId: 'skill-13',
          estimatedHours: 12,
        },
        {
          name: 'Clean Code Practices',
          nodeType: 'optional',
          skillId: 'skill-7',
          estimatedHours: 5,
        },
        { name: 'Git Workflow', nodeType: 'required', skillId: 'skill-8', estimatedHours: 4 },
      ],
    },
    {
      name: 'Deployment Basics',
      nodeType: 'group',
      children: [
        { name: 'Docker Basics', nodeType: 'required', skillId: 'skill-9', estimatedHours: 8 },
        { name: 'CI/CD Basics', nodeType: 'optional', skillId: 'skill-10', estimatedHours: 10 },
      ],
    },
    {
      name: 'Capstone: Production Backend',
      nodeType: 'milestone',
      description: 'Deploy a complete backend with auth, testing, and CI/CD pipelines.',
    },
  ],
};

export const MOCK_FLAT_NODES: FlatNode[] = [
  // Foundations Group
  {
    tempId: 't0',
    tempParentId: null,
    realId: 'r0',
    realParentId: null,
    name: 'Backend Foundations',
    nodeType: 'GROUP',
    description: null,
    estimatedHours: null,
    skillId: null,
  },
  {
    tempId: 't1',
    tempParentId: 't0',
    realId: 'r1',
    realParentId: 'r0',
    name: 'HTTP & REST',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 6,
    skillId: 'skill-1',
  },
  {
    tempId: 't2',
    tempParentId: 't0',
    realId: 'r2',
    realParentId: 'r0',
    name: 'Node.js Basics',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 10,
    skillId: 'skill-2',
  },
  {
    tempId: 't3',
    tempParentId: 't0',
    realId: 'r3',
    realParentId: 'r0',
    name: 'NestJS Framework',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 15,
    skillId: 'skill-3',
  },
  {
    tempId: 't4',
    tempParentId: 't0',
    realId: 'r4',
    realParentId: 'r0',
    name: 'Error Handling',
    nodeType: 'OPTIONAL',
    description: null,
    estimatedHours: 5,
    skillId: 'skill-12',
  },

  // Database Group
  {
    tempId: 't5',
    tempParentId: null,
    realId: 'r5',
    realParentId: null,
    name: 'Database & ORM',
    nodeType: 'GROUP',
    description: null,
    estimatedHours: null,
    skillId: null,
  },
  {
    tempId: 't6',
    tempParentId: 't5',
    realId: 'r6',
    realParentId: 'r5',
    name: 'PostgreSQL',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 8,
    skillId: 'skill-4',
  },
  {
    tempId: 't7',
    tempParentId: 't5',
    realId: 'r7',
    realParentId: 'r5',
    name: 'Prisma ORM',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 10,
    skillId: 'skill-5',
  },

  // Milestone 1
  {
    tempId: 't8',
    tempParentId: null,
    realId: 'r8',
    realParentId: null,
    name: 'Capstone: REST API',
    nodeType: 'MILESTONE',
    description: 'Build a fully functional REST API',
    estimatedHours: null,
    skillId: null,
  },

  // Advanced Engineering Group
  {
    tempId: 't9',
    tempParentId: null,
    realId: 'r9',
    realParentId: null,
    name: 'Advanced Engineering',
    nodeType: 'GROUP',
    description: null,
    estimatedHours: null,
    skillId: null,
  },
  {
    tempId: 't10',
    tempParentId: 't9',
    realId: 'r10',
    realParentId: 'r9',
    name: 'Authentication (JWT)',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 12,
    skillId: 'skill-6',
  },
  {
    tempId: 't11',
    tempParentId: 't9',
    realId: 'r11',
    realParentId: 'r9',
    name: 'API Documentation (Swagger)',
    nodeType: 'OPTIONAL',
    description: null,
    estimatedHours: 6,
    skillId: 'skill-11',
  },
  {
    tempId: 't12',
    tempParentId: 't9',
    realId: 'r12',
    realParentId: 'r9',
    name: 'Unit Testing (Jest)',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 12,
    skillId: 'skill-13',
  },
  {
    tempId: 't13',
    tempParentId: 't9',
    realId: 'r13',
    realParentId: 'r9',
    name: 'Clean Code Practices',
    nodeType: 'OPTIONAL',
    description: null,
    estimatedHours: 5,
    skillId: 'skill-7',
  },
  {
    tempId: 't14',
    tempParentId: 't9',
    realId: 'r14',
    realParentId: 'r9',
    name: 'Git Workflow',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 4,
    skillId: 'skill-8',
  },

  // Deployment Basics Group
  {
    tempId: 't15',
    tempParentId: null,
    realId: 'r15',
    realParentId: null,
    name: 'Deployment Basics',
    nodeType: 'GROUP',
    description: null,
    estimatedHours: null,
    skillId: null,
  },
  {
    tempId: 't16',
    tempParentId: 't15',
    realId: 'r16',
    realParentId: 'r15',
    name: 'Docker Basics',
    nodeType: 'REQUIRED',
    description: null,
    estimatedHours: 8,
    skillId: 'skill-9',
  },
  {
    tempId: 't17',
    tempParentId: 't15',
    realId: 'r17',
    realParentId: 'r15',
    name: 'CI/CD Basics',
    nodeType: 'OPTIONAL',
    description: null,
    estimatedHours: 10,
    skillId: 'skill-10',
  },

  // Milestone 2
  {
    tempId: 't18',
    tempParentId: null,
    realId: 'r18',
    realParentId: null,
    name: 'Capstone: Production Backend',
    nodeType: 'MILESTONE',
    description: 'Deploy a complete backend',
    estimatedHours: null,
    skillId: null,
  },
];

export const MOCK_LAYOUT_MAP = new Map(
  MOCK_FLAT_NODES.map((n, i) => [n.tempId, { posX: i * 100, posY: i * 50 }]),
);

export const MOCK_ROADMAP = {
  id: 'roadmap-uuid-5678',
  userId: MOCK_USER_ID,
  roleCategory: RoleCategory.BACKEND,
  title: 'Backend Engineer Roadmap',
  description: 'A comprehensive plan tailored to Node.js, NestJS, and production practices.',
  goalName: MOCK_DTO.goal,
  hoursPerDay: MOCK_DTO.hoursPerDay,
  deadlineDate: new Date('2030-12-31T23:59:59.999Z'),
  isTemplate: false,
  generatedAt: new Date(),
  updatedAt: new Date(),
};
