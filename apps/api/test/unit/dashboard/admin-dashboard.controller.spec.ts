import 'reflect-metadata';

import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { UserRole } from '@repo/db/prisma/client';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminDashboardController } from '@/modules/dashboard/admin-dashboard.controller';
import { AdminDashboardService } from '@/modules/dashboard/admin-dashboard.service';

describe('AdminDashboardController', () => {
  const mockAdminDashboardService = {
    getDashboard: jest.fn(),
  };

  let controller: AdminDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [
        {
          provide: AdminDashboardService,
          useValue: mockAdminDashboardService,
        },
      ],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin role metadata at the controller level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminDashboardController)).toEqual([UserRole.ADMIN]);
  });

  it('delegates dashboard lookup to the service', async () => {
    const response = {
      recentActivity: [],
      totals: {
        resources: 3,
        skills: 1,
        templateNodes: 4,
        templates: 2,
      },
    };

    mockAdminDashboardService.getDashboard.mockResolvedValue(response);

    const result = await controller.getDashboard();

    expect(mockAdminDashboardService.getDashboard).toHaveBeenCalledWith();
    expect(result).toEqual(response);
  });
});
