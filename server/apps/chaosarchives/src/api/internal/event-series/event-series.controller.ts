import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { EventOccurrenceDto, EventSeriesDto } from '@app/shared/dto/events/event-series.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { EventSeriesService, MAX_SERIES_OCCURRENCES } from './event-series.service';

class NextOccurrencesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERIES_OCCURRENCES)
  @IsOptional()
  count?: number;
}

@Controller('event-series')
export class EventSeriesController {
  constructor(private readonly seriesService: EventSeriesService) {}

  @Get('mine')
  @RoleRequired(Role.USER)
  async getMySeries(@CurrentUser() user: UserInfo): Promise<EventSeriesDto[]> {
    return this.seriesService.getMySeries(user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getSeries(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: UserInfo): Promise<EventSeriesDto> {
    return this.seriesService.getSeries(id, user);
  }

  @Get(':id/next')
  async getNextOccurrences(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: NextOccurrencesQueryDto,
  ): Promise<EventOccurrenceDto[]> {
    return this.seriesService.getNextOccurrences(id, query.count || 3);
  }

  @Post()
  @RoleRequired(Role.USER)
  async createSeries(@Body() series: EventSeriesDto, @CurrentUser() user: UserInfo): Promise<EventSeriesDto> {
    return this.seriesService.createSeries(series, user);
  }

  @Put(':id')
  @RoleRequired(Role.USER)
  async updateSeries(
    @Param('id', ParseIntPipe) id: number,
    @Body() series: EventSeriesDto,
    @CurrentUser() user: UserInfo,
  ): Promise<EventSeriesDto> {
    return this.seriesService.updateSeries(id, series, user);
  }
}
