import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createEventSchema,
  type CreateEventDto,
} from './dto/create-event.dto.js';
import {
  updateEventSchema,
  updateEventStatusSchema,
  type UpdateEventDto,
  type UpdateEventStatusDto,
} from './dto/update-event.dto.js';
import {
  queryEventsSchema,
  type QueryEventsDto,
} from './dto/query-events.dto.js';

@Controller('events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Public()
  async listPublicEvents(
    @Query(new ZodValidationPipe(queryEventsSchema)) query: QueryEventsDto,
  ) {
    return this.eventsService.listEvents(query, true);
  }

  @Get('organizer/my-events')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async listMyEvents(
    @CurrentUser('id') organizerId: string,
    @Query(new ZodValidationPipe(queryEventsSchema)) query: QueryEventsDto,
  ) {
    return this.eventsService.listEvents(
      {
        ...query,
        organizerId,
      },
      false,
    );
  }

  @Get(':slug')
  @Public()
  async getEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.getEventBySlug(slug);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async createEvent(
    @CurrentUser('id') organizerId: string,
    @Body(new ZodValidationPipe(createEventSchema)) body: CreateEventDto,
  ) {
    return this.eventsService.createEvent(organizerId, body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async updateEvent(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(updateEventSchema)) body: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(userId, userRole, eventId, body);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async updateEventStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') eventId: string,
    @Body(new ZodValidationPipe(updateEventStatusSchema)) body: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateEventStatus(
      userId,
      userRole,
      eventId,
      body,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('organizer', 'admin')
  async deleteEvent(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') eventId: string,
  ) {
    return this.eventsService.deleteEvent(userId, userRole, eventId);
  }
}
