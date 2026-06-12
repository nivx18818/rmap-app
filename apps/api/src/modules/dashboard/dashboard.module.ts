import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ActivityController } from './activity.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController, AdminDashboardController, DashboardController],
  providers: [AdminDashboardService, DashboardService],
})
export class DashboardModule {}
