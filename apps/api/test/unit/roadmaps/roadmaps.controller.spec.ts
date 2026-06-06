import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { NodeStatus } from '@repo/db/prisma/client';

import { RoadmapsController } from '@/modules/roadmaps/roadmaps.controller';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

describe('RoadmapsController', () => {
  let controller: RoadmapsController;

  const mockRoadmapsService = {
    deleteByIdForOwner: jest.fn(),
    deleteTemplateProgress: jest.fn(),
    generate: jest.fn(),
    getByIdForOwner: jest.fn(),
    getLatestMilestoneSubmission: jest.fn(),
    getNodeDetail: jest.fn(),
    getNodeQuiz: jest.fn(),
    getProgressSummary: jest.fn(),
    listNodes: jest.fn(),
    listUserRoadmaps: jest.fn(),
    startLearning: jest.fn(),
    submitMilestoneSubmission: jest.fn(),
    submitNodeQuiz: jest.fn(),
    updateNodeProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoadmapsController],
      providers: [
        {
          provide: RoadmapsService,
          useValue: mockRoadmapsService,
        },
      ],
    }).compile();

    controller = module.get<RoadmapsController>(RoadmapsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call listNodes and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const mockResponse = { nodes: [] };

    mockRoadmapsService.listNodes.mockResolvedValue(mockResponse);

    const result = await controller.listNodes(mockUser, 'roadmap-1', { q: 'REST' });

    expect(mockRoadmapsService.listNodes).toHaveBeenCalledWith('user-1', 'roadmap-1', {
      q: 'REST',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should call getNodeDetail and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const mockResponse = {
      node: {
        id: 'node-1',
        roadmapId: 'roadmap-1',
        parentId: 'group-1',
        skillId: 'skill-1',
        name: 'REST API',
        description: null,
        nodeType: 'REQUIRED',
        estimatedHours: 6,
        posX: 140,
        posY: 240,
        resourcesCount: 0,
        progress: null,
      },
      skill: null,
      resources: null,
      prerequisites: [],
      latestSubmission: null,
      milestoneTestSuite: null,
    };

    mockRoadmapsService.getNodeDetail.mockResolvedValue(mockResponse);

    const result = await controller.getNodeDetail(mockUser, 'roadmap-1', 'node-1');

    expect(mockRoadmapsService.getNodeDetail).toHaveBeenCalledWith('user-1', 'roadmap-1', 'node-1');
    expect(result).toEqual(mockResponse);
  });

  describe('listRoadmaps', () => {
    it('should list roadmaps for current user', async () => {
      const mockResponse = {
        data: [],
        meta: {
          page: 1,
          perPage: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockRoadmapsService.listUserRoadmaps.mockResolvedValue(mockResponse);

      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };
      const query = { page: 2, perPage: 10 };

      const result = await controller.listRoadmaps(user, query);

      expect(mockRoadmapsService.listUserRoadmaps).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should get a roadmap for the current user', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };
      const response = {
        deadlineDate: null,
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: '2025-04-24T07:00:00.000Z',
        goalName: null,
        hoursPerDay: null,
        id: 'roadmap-1',
        isTemplate: false,
        roleCategory: 'WEB_DEVELOPMENT',
        startedAt: null,
        title: 'Backend roadmap',
        updatedAt: '2025-04-25T08:00:00.000Z',
        userId: 'user-1',
      };

      mockRoadmapsService.getByIdForOwner.mockResolvedValue(response);

      const result = await controller.get(user, 'roadmap-1');

      expect(mockRoadmapsService.getByIdForOwner).toHaveBeenCalledWith('user-1', 'roadmap-1');
      expect(result).toEqual(response);
    });
  });

  describe('getProgressSummary', () => {
    it('should call getProgressSummary and return response', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      const response = {
        roadmapId: 'roadmap-1',
        completionPct: 40,
        streakDays: 3,
        skillReadinessPct: 50,
        nodesTotal: 5,
        nodesCompleted: 2,
        timelineWarning: null,
      };

      mockRoadmapsService.getProgressSummary.mockResolvedValue(response);

      const result = await controller.getProgressSummary(user, 'roadmap-1');

      expect(mockRoadmapsService.getProgressSummary).toHaveBeenCalledWith('user-1', 'roadmap-1');
      expect(result).toEqual(response);
    });
  });

  describe('remove', () => {
    it('should delete a roadmap for the current user and return no body', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };

      mockRoadmapsService.deleteByIdForOwner.mockResolvedValue(undefined);

      const result = await controller.remove(user, 'roadmap-1');

      expect(mockRoadmapsService.deleteByIdForOwner).toHaveBeenCalledWith('user-1', 'roadmap-1');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteTemplateProgress', () => {
    it('should delete template progress for the current user and return no body', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };

      mockRoadmapsService.deleteTemplateProgress.mockResolvedValue(undefined);

      const result = await controller.deleteTemplateProgress(user, 'template-1');

      expect(mockRoadmapsService.deleteTemplateProgress).toHaveBeenCalledWith(
        'user-1',
        'template-1',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('startLearning', () => {
    it('should start a roadmap for the current user', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };
      const response = {
        roadmap: {
          deadlineDate: null,
          description: 'A backend plan',
          estimatedWeeks: null,
          generatedAt: '2025-04-24T07:00:00.000Z',
          goalName: null,
          hoursPerDay: null,
          id: 'roadmap-1',
          isTemplate: false,
          roleCategory: 'WEB_DEVELOPMENT',
          startedAt: '2025-04-24T07:30:00.000Z',
          title: 'Backend roadmap',
          updatedAt: '2025-04-25T08:00:00.000Z',
          userId: 'user-1',
        },
        unlockedNodes: ['group-1', 'leaf-1'],
      };

      mockRoadmapsService.startLearning.mockResolvedValue(response);

      const result = await controller.startLearning(user, 'roadmap-1');

      expect(mockRoadmapsService.startLearning).toHaveBeenCalledWith('user-1', 'roadmap-1');
      expect(result).toEqual(response);
    });
  });

  it('should call getNodeQuiz and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const mockResponse = {
      nodeId: 'node-1',
      skillId: 'skill-1',
      questions: [],
    };

    mockRoadmapsService.getNodeQuiz.mockResolvedValue(mockResponse);

    const result = await controller.getNodeQuiz(mockUser, 'roadmap-1', 'node-1');

    expect(mockRoadmapsService.getNodeQuiz).toHaveBeenCalledWith('user-1', 'roadmap-1', 'node-1');
    expect(result).toEqual(mockResponse);
  });

  describe('updateNodeProgress', () => {
    it('should call updateNodeProgress and return response', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      const dto = { status: NodeStatus.COMPLETED };
      const mockResponse = {
        progress: {
          id: 'progress-1',
          roadmapNodeId: 'node-1',
          status: NodeStatus.COMPLETED,
          startedAt: new Date('2026-01-01T00:00:00Z'),
          completedAt: new Date('2026-01-02T00:00:00Z'),
          quizScorePct: null,
          quizPassed: true,
        },
        unlockedNodes: ['leaf-2', 'leaf-3'],
      };

      mockRoadmapsService.updateNodeProgress.mockResolvedValue(mockResponse);

      const result = await controller.updateNodeProgress(mockUser, 'roadmap-1', 'node-1', dto);

      expect(mockRoadmapsService.updateNodeProgress).toHaveBeenCalledWith(
        'user-1',
        'roadmap-1',
        'node-1',
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  it('should call submitNodeQuiz and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const dto = {
      answers: [
        { questionId: 'question-1', selectedOption: 'A' },
        { questionId: 'question-2', selectedOption: 'B' },
        { questionId: 'question-3', selectedOption: 'C' },
        { questionId: 'question-4', selectedOption: 'D' },
        { questionId: 'question-5', selectedOption: 'A' },
      ],
    };
    const mockResponse = {
      scorePct: 100,
      passed: true,
      correctCount: 5,
      totalQuestions: 5,
      results: [],
      nodeProgress: {
        id: 'progress-1',
        roadmapNodeId: 'node-1',
        status: 'COMPLETED',
        startedAt: null,
        completedAt: new Date('2026-01-02T00:00:00Z'),
        quizScorePct: 100,
        quizPassed: true,
      },
      unlockedNodes: ['leaf-2'],
      suggestion: null,
    };

    mockRoadmapsService.submitNodeQuiz.mockResolvedValue(mockResponse);

    const result = await controller.submitNodeQuiz(mockUser, 'roadmap-1', 'node-1', dto);

    expect(mockRoadmapsService.submitNodeQuiz).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
      dto,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should call submitMilestoneSubmission and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const dto = {
      repoUrl: 'https://github.com/acme/api-project',
    };
    const mockResponse = {
      submission: {
        id: 'submission-1',
        repoUrl: dto.repoUrl,
        testSuiteId: 'suite-1',
        status: 'RUNNING',
        outputLog: null,
        passRatePct: null,
        passedTests: null,
        testResults: null,
        totalTests: null,
        attemptNumber: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
      },
    };

    mockRoadmapsService.submitMilestoneSubmission.mockResolvedValue(mockResponse);

    const result = await controller.submitMilestoneSubmission(mockUser, 'roadmap-1', 'node-1', dto);

    expect(mockRoadmapsService.submitMilestoneSubmission).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
      dto,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should call getLatestMilestoneSubmission and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const mockResponse = { submission: null };

    mockRoadmapsService.getLatestMilestoneSubmission.mockResolvedValue(mockResponse);

    const result = await controller.getLatestMilestoneSubmission(mockUser, 'roadmap-1', 'node-1');

    expect(mockRoadmapsService.getLatestMilestoneSubmission).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
    );
    expect(result).toEqual(mockResponse);
  });
});
