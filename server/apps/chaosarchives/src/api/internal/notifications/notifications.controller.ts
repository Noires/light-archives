import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import {
  NotificationDto,
  NotificationListQueryDto,
  NotificationPreferencesDto,
  NotificationPreferencesUpdateDto,
  NotificationUnreadCountDto,
} from '@app/shared/dto/social/notification.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const DEFAULT_LIMIT = 30;

/** ER2 social: in-app notifications. No tracking; users can delete each notification. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RoleRequired(Role.USER)
  async list(@Query() query: NotificationListQueryDto, @CurrentUser() user: UserInfo): Promise<NotificationDto[]> {
    return this.notificationsService.list(user.id, query.unreadOnly || false, query.limit || DEFAULT_LIMIT);
  }

  @Get('unread-count')
  @RoleRequired(Role.USER)
  async getUnreadCount(@CurrentUser() user: UserInfo): Promise<NotificationUnreadCountDto> {
    return { count: await this.notificationsService.getUnreadCount(user.id) };
  }

  @Get('preferences')
  @RoleRequired(Role.USER)
  async getPreferences(@CurrentUser() user: UserInfo): Promise<NotificationPreferencesDto> {
    return this.notificationsService.getPreferences(user.id);
  }

  @Put('preferences')
  @RoleRequired(Role.USER)
  async updatePreferences(
    @Body() update: NotificationPreferencesUpdateDto,
    @CurrentUser() user: UserInfo,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.updatePreferences(user.id, update);
  }

  // Declared before ':id/read'
  @Put('read-all')
  @RoleRequired(Role.USER)
  async markAllRead(@CurrentUser() user: UserInfo): Promise<void> {
    await this.notificationsService.markAllRead(user.id);
  }

  @Put(':id/read')
  @RoleRequired(Role.USER)
  async markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
    await this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  @RoleRequired(Role.USER)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
    await this.notificationsService.delete(user.id, id);
  }
}
