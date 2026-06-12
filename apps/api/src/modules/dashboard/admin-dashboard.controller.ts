import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@repo/db/prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';

import type { AdminDashboardResponse } from './types/admin-dashboard-response.types';

import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  async getDashboard(): Promise<AdminDashboardResponse> {
    return this.adminDashboardService.getDashboard();
  }
}
