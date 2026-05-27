import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { ActivityController } from '@/modules/dashboard/activity.controller';
import { DashboardController } from '@/modules/dashboard/dashboard.controller';
import { DashboardService } from '@/modules/dashboard/dashboard.service';

describe('DashboardController', () => {
  let activityController: ActivityController;
  let controller: DashboardController;

  const mockDashboardService = {
    getActivitySummary: jest.fn(),
    getDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController, DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    activityController = module.get<ActivityController>(ActivityController);
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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: 'user',
        createdAt: user.createdAt.toISOString(),
      },
      activeRoadmap: null,
      streakDays: 0,
      activityRecent: [],
    };

    mockDashboardService.getDashboard.mockResolvedValue(response);

    const result = await controller.getDashboard(user);

    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(response);
  });

  it('should call getActivitySummary and return response', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const query = { from: '2026-05-18', to: '2026-05-20' };
    const response = {
      streakDays: 2,
      longestStreak: 4,
      activity: [
        { activityDate: '2026-05-18', nodesCompleted: 0 },
        { activityDate: '2026-05-19', nodesCompleted: 1 },
        { activityDate: '2026-05-20', nodesCompleted: 2 },
      ],
    };

    mockDashboardService.getActivitySummary.mockResolvedValue(response);

    const result = await activityController.getMyActivity(user, query);

    expect(mockDashboardService.getActivitySummary).toHaveBeenCalledWith('user-1', query);
    expect(result).toEqual(response);
  });
});
