import { Controller, Get, Query } from '@nestjs/common';

import type { DashboardHomeResponse } from './types/dashboard-home-response.types';
import type { DashboardResponse } from './types/dashboard-response.types';
import type { DashboardSearchResponse } from './types/dashboard-search-response.types';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardSearchQueryDto } from './dto/dashboard-search-query.dto';

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

  /**
   * GET /dashboard/home
   *
   * Returns the mobile home payload for active learning roadmaps.
   */
  @Get('home')
  async getHome(@CurrentUser() user: RequestUser): Promise<DashboardHomeResponse> {
    return this.dashboardService.getHome(user.id);
  }

  /**
   * GET /dashboard/search
   *
   * Returns mobile home search results across template roadmaps,
   * the user's AI roadmaps, and matching skills.
   */
  @Get('search')
  async search(
    @CurrentUser() user: RequestUser,
    @Query() query: DashboardSearchQueryDto,
  ): Promise<DashboardSearchResponse> {
    return this.dashboardService.search(user.id, query);
  }
}
