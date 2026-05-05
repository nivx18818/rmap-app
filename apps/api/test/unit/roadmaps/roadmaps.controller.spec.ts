import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { RoadmapsController } from '@/modules/roadmaps/roadmaps.controller';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

describe('RoadmapsController', () => {
  let controller: RoadmapsController;

  const mockRoadmapsService = {
    generate: jest.fn(),
    listNodes: jest.fn(),
    listUserRoadmaps: jest.fn(),
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
});
