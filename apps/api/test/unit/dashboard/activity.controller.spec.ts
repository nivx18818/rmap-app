import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { ActivityController } from '@/modules/dashboard/activity.controller';
import { DashboardService } from '@/modules/dashboard/dashboard.service';

describe('ActivityController', () => {
  let controller: ActivityController;

  const dashboardService = {
    getActivitySummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();

    controller = module.get(ActivityController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates current-user activity queries to DashboardService', async () => {
    const query = { from: '2026-05-01', to: '2026-05-31' };
    const user = {
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      email: 'learner@example.test',
      fullName: 'Learner One',
      id: 'user-1',
      role: 'USER',
    };
    const response = {
      activity: [{ activityDate: '2026-05-31', nodesCompleted: 2 }],
      currentStreak: 1,
      longestStreak: 3,
      range: { from: '2026-05-01', to: '2026-05-31' },
      totalNodesCompleted: 2,
    };
    dashboardService.getActivitySummary.mockResolvedValue(response);

    await expect(controller.getMyActivity(user, query)).resolves.toEqual(response);
    expect(dashboardService.getActivitySummary).toHaveBeenCalledWith('user-1', query);
  });
});
