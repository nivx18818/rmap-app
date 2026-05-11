import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { RoadmapsController } from '@/modules/roadmaps/roadmaps.controller';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

describe('RoadmapsController', () => {
  let controller: RoadmapsController;

  const mockRoadmapsService = {
    generate: jest.fn(),
    listNodes: jest.fn(),
    submitQuiz: jest.fn(),
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

  it('should call submitQuiz and return response', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const dto = {
      answers: [
        {
          question_id: '11111111-1111-1111-1111-111111111111',
          selected_option: 'A' as const,
        },
      ],
    };
    const mockResponse = { score_pct: 100 };

    mockRoadmapsService.submitQuiz.mockResolvedValue(mockResponse);

    const result = await controller.submitQuiz(mockUser, 'roadmap-1', 'node-1', dto);

    expect(mockRoadmapsService.submitQuiz).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
      dto,
    );
    expect(result).toEqual(mockResponse);
  });
});
