import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { DashboardController } from '@/modules/dashboard/dashboard.controller';
import { DashboardService } from '@/modules/dashboard/dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    getDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call getDashboard and return response', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const response = {
      user_profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: 'user',
        createdAt: user.createdAt.toISOString(),
      },
      activeRoadmaps: [],
      userRoadmaps: [],
      streakDays: 0,
      activityRecent: [],
      summary: {
        totalRoadmaps: 0,
        activeRoadmaps: 0,
        completedRoadmaps: 0,
        totalSkills: 0,
        completedSkills: 0,
        inProgressSkills: 0,
        lockedSkills: 0,
        currentStreak: 0,
      },
      skillCategories: [],
      roadmapStatus: {
        behindPace: 0,
        onTrack: 0,
        completed: 0,
        notStarted: 0,
      },
    };

    mockDashboardService.getDashboard.mockResolvedValue(response);

    const result = await controller.getDashboard(user);

    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(response);
  });
});
