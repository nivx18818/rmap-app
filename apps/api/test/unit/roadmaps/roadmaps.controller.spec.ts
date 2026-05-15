import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { RoadmapsController } from '@/modules/roadmaps/roadmaps.controller';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

describe('RoadmapsController', () => {
  let controller: RoadmapsController;

  const mockRoadmapsService = {
    deleteByIdForOwner: jest.fn(),
    generate: jest.fn(),
    getByIdForOwner: jest.fn(),
    getNodeQuiz: jest.fn(),
    listNodes: jest.fn(),
    listUserRoadmaps: jest.fn(),
    submitNodeQuiz: jest.fn(),
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
        status: 'IN_PROGRESS',
        startedAt: null,
        completedAt: null,
        quizScorePct: 100,
        quizPassed: true,
      },
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
});
