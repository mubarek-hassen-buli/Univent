import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Retrieves organizer's performance analytics, occupancy and turnout rates
   */
  @Get('organizer')
  @Roles('organizer', 'admin')
  async getOrganizerAnalytics(
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.analyticsService.getOrganizerAnalytics(user.id);
  }

  /**
   * Retrieves platform-wide analytics for system administrators
   */
  @Get('admin')
  @Roles('admin')
  async getAdminAnalytics() {
    return this.analyticsService.getAdminAnalytics();
  }
}
