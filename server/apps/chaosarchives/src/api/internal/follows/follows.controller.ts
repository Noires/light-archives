import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import {
  FOLLOW_TARGET_TYPES,
  FollowDto,
  FollowRequestDto,
  FollowStatusDto,
  FollowStatusQueryDto,
  FollowTargetType,
} from '@app/shared/dto/social/follow.dto';
import { Role } from '@app/shared/enums/role.enum';
import { BadRequestException, Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { FollowsService } from './follows.service';

function parseTargetType(value: string): FollowTargetType {
  if (!FOLLOW_TARGET_TYPES.includes(value as FollowTargetType)) {
    throw new BadRequestException('Invalid target type');
  }

  return value as FollowTargetType;
}

/** ER2 social: follows. Users can delete every follow at any time (DSGVO). */
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get()
  @RoleRequired(Role.USER)
  async getMine(@CurrentUser() user: UserInfo): Promise<FollowDto[]> {
    return this.followsService.getMine(user);
  }

  // Declared before the parameterised routes
  @Get('status')
  @RoleRequired(Role.USER)
  async getStatus(@Query() query: FollowStatusQueryDto, @CurrentUser() user: UserInfo): Promise<FollowStatusDto> {
    return this.followsService.getStatus(query.targetType, query.targetKey, user);
  }

  @Put()
  @RoleRequired(Role.USER)
  async follow(@Body() request: FollowRequestDto, @CurrentUser() user: UserInfo): Promise<FollowStatusDto> {
    return this.followsService.follow(request.targetType, request.targetKey, user);
  }

  @Delete(':targetType/:targetKey')
  @RoleRequired(Role.USER)
  async unfollow(
    @Param('targetType') targetType: string,
    @Param('targetKey') targetKey: string,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.followsService.unfollow(parseTargetType(targetType), targetKey, user);
  }
}
