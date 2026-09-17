import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('registrations')
@UseGuards(AuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('event/:eventId')
  async registerForEvent(
    @CurrentUser('id') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.registrationsService.registerForEvent(userId, eventId);
  }

  @Get('my-tickets')
  async getMyTickets(@CurrentUser('id') userId: string) {
    return this.registrationsService.getMyTickets(userId);
  }

  @Get('ticket/:id')
  async getTicketById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') registrationId: string,
  ) {
    return this.registrationsService.getTicketById(userId, userRole, registrationId);
  }

  @Post('cancel/:id')
  async cancelRegistration(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') registrationId: string,
  ) {
    return this.registrationsService.cancelRegistration(userId, userRole, registrationId);
  }

  @Get('event/:eventId/attendees')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async getEventAttendees(
    @CurrentUser('id') organizerId: string,
    @CurrentUser('role') userRole: string,
    @Param('eventId') eventId: string,
  ) {
    return this.registrationsService.getEventAttendees(
      organizerId,
      userRole,
      eventId,
    );
  }
}
