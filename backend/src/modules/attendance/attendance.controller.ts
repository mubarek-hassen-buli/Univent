import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import {
  scanTicketSchema,
  type ScanTicketDto,
} from './dto/scan-ticket.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller('attendance')
@UseGuards(AuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Scans a digital ticket QR code or checks in via registration code
   * Restricted to event organizers and system admins
   */
  @Post('scan')
  @Roles('organizer', 'admin')
  async scanTicket(
    @Body(new ZodValidationPipe(scanTicketSchema)) dto: ScanTicketDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.attendanceService.scanAndCheckIn(dto, user);
  }

  /**
   * Retrieves real-time attendance statistics and recent scans for an event
   */
  @Get('event/:eventId/stats')
  @Roles('organizer', 'admin')
  async getEventAttendanceStats(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.attendanceService.getEventAttendanceStats(eventId, user);
  }

  /**
   * Retrieves attendee roster and check-in status for an event
   */
  @Get('event/:eventId/roster')
  @Roles('organizer', 'admin')
  async getEventRoster(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.attendanceService.getEventRoster(eventId, user);
  }
}
