import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import { CalendarTokenDto } from '@app/shared/dto/social/calendar-token.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Controller, Delete, Get, Header, Param, Post } from '@nestjs/common';
import { CalendarTokenService } from './calendar-token.service';

/** ER2 social: personal calendar subscription. */
@Controller()
export class CalendarTokenController {
  constructor(private readonly calendarTokenService: CalendarTokenService) {}

  @Get('calendar-token')
  @RoleRequired(Role.USER)
  async get(@CurrentUser() user: UserInfo): Promise<CalendarTokenDto | null> {
    return this.calendarTokenService.get(user.id);
  }

  @Post('calendar-token')
  @RoleRequired(Role.USER)
  async createOrRotate(@CurrentUser() user: UserInfo): Promise<CalendarTokenDto> {
    return this.calendarTokenService.createOrRotate(user.id);
  }

  @Delete('calendar-token')
  @RoleRequired(Role.USER)
  async revoke(@CurrentUser() user: UserInfo): Promise<void> {
    await this.calendarTokenService.revoke(user.id);
  }

  /** Public, authenticated by the secret token only. Calendar clients poll; let them cache for 15 minutes. */
  @Get('calendar/:token.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'private, max-age=900')
  @Header('X-Robots-Tag', 'noindex')
  async getFeed(@Param('token') token: string): Promise<string> {
    return this.calendarTokenService.getFeed(token);
  }
}
