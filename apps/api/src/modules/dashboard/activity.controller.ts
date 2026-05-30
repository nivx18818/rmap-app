import { Controller, Get, Query } from '@nestjs/common';

import type { ActivitySummaryResponse } from './types/dashboard-response.types';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { ActivityQueryDto } from './dto/activity-query.dto';

@Controller('users/me/activity')
export class ActivityController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getMyActivity(
    @CurrentUser() user: RequestUser,
    @Query() query: ActivityQueryDto,
  ): Promise<ActivitySummaryResponse> {
    return await this.dashboardService.getActivitySummary(user.id, query);
  }
}
