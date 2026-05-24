import { Controller, Get } from '@nestjs/common';

import type { DashboardResponse } from './types/dashboard-response.types';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard
   *
   * Returns the authenticated user's profile summary, active roadmap,
   * streak, and recent activity.
   */
  @Get()
  async getDashboard(@CurrentUser() user: RequestUser): Promise<DashboardResponse> {
    return this.dashboardService.getDashboard(user.id);
  }
}
