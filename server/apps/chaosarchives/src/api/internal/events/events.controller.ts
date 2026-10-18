import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventCreaterResultDto } from '@app/shared/dto/events/event-create-result.dto';
import { EventEditDto } from '@app/shared/dto/events/event-edit.dto';
import { EventRegistrationRequestDto } from '@app/shared/dto/events/event-registration-request.dto';
import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { EventSummariesDto } from '@app/shared/dto/events/event-summaries.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
import { Role } from '@app/shared/enums/role.enum';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { EventsService } from './events.service';

class GetEventParamDto {
  @IsOptional()
  @Transform((val) => val.value === 'true')
  edit?: boolean;
}

class VenueEventsQueryDto {
  @IsOptional()
  @IsIn(['upcoming', 'past', 'all'])
  timeRange?: 'upcoming' | 'past' | 'all';
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('/')
  async getEvents(@Query('refresh', ParseBoolPipe) refresh = false): Promise<EventSummariesDto> {
    return this.eventsService.getEvents(refresh);
  }

  @Get('/search')
  @RoleRequired(Role.USER)
  async search(@Query('query') query: string): Promise<EventSearchResultDto[]> {
    return this.eventsService.search(query);
  }

  @Get('/month/:year/:month')
  async getByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<EventSummaryDto[]> {
    return this.eventsService.getByMonth(year, month);
  }

  // ER2-802: per-user feed of events the user's characters registered for. Declared before '/:id'.
  @Get('/my.ics')
  @RoleRequired(Role.USER)
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="elpisgarten-meine-events.ics"')
  @Header('Cache-Control', 'private, no-store')
  async getMyEventsIcs(@CurrentUser() user: UserInfo): Promise<string> {
    return this.eventsService.getMyEventsIcs(user);
  }

  @Get('/:id/ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async getEventIcs(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response): Promise<string> {
    res.setHeader('Content-Disposition', `attachment; filename="event-${id}.ics"`);
    return this.eventsService.getEventIcs(id);
  }

  @Get('/venue/:id')
  async getEventsForVenue(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: VenueEventsQueryDto,
  ): Promise<EventSummaryDto[]> {
    return this.eventsService.getEventsForVenue(id, query.timeRange || 'upcoming');
  }

  @Get('/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getEvent(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryParams: GetEventParamDto,
    @CurrentUser() user?: UserInfo,
  ): Promise<BaseEventDto> {
    return this.eventsService.getEvent(id, queryParams.edit || false, user);
  }

  @Post()
  @RoleRequired(Role.USER)
  async createEvent(
    @Body() event: EventEditDto,
    @CurrentUser() user: UserInfo,
    @Query('characterId') queryCharacterId?: string,
  ): Promise<EventCreaterResultDto> {
    // Support both DTO and query param during transition
    const characterId = event.characterId ?? (queryCharacterId ? parseInt(queryCharacterId, 10) : undefined);

    if (!characterId) {
      throw new BadRequestException('characterId is required (in body or query)');
    }

    return this.eventsService.createEvent(event, characterId, user);
  }

  @Put('/:id')
  @RoleRequired(Role.USER)
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() event: EventEditDto,
    @CurrentUser() user: UserInfo,
  ): Promise<EventEditDto> {
    return this.eventsService.updateEvent(id, event, user);
  }

  @Delete('/:id')
  @RoleRequired(Role.USER)
  async deleteEvent(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
    return this.eventsService.deleteEvent(id, user);
  }

  @Post('/:id/registrations')
  @RoleRequired(Role.USER)
  async registerForEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: EventRegistrationRequestDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.eventsService.registerForEvent(id, body.characterId, user, body.kind);
  }

  @Delete('/:id/registrations/:characterId')
  @RoleRequired(Role.USER)
  async unregisterForEvent(
    @Param('id', ParseIntPipe) id: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.eventsService.unregisterForEvent(id, characterId, user);
  }
}
