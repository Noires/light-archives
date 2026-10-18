import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import {
  ReactionHiddenRequestDto,
  ReactionModerationDto,
  ReactionSummaryDto,
  ReactionToggleRequestDto,
} from '@app/shared/dto/reactions/reaction.dto';
import { REACTION_TARGET_TYPES, ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { Role } from '@app/shared/enums/role.enum';
import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ReactionsService } from './reactions.service';

function parseTargetType(value: string): ReactionTargetType {
  if (!REACTION_TARGET_TYPES.includes(value as ReactionTargetType)) {
    throw new BadRequestException('Invalid target type');
  }

  return value as ReactionTargetType;
}

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('toggle')
  @RoleRequired(Role.USER)
  async toggle(@Body() request: ReactionToggleRequestDto, @CurrentUser() user: UserInfo): Promise<ReactionSummaryDto> {
    return this.reactionsService.toggle(request, user);
  }

  // Moderation hook: list single reactions incl. hidden ones
  @Get(':targetType/:targetId/all')
  @RoleRequired(Role.MODERATOR)
  async listForModeration(
    @Param('targetType') targetType: string,
    @Param('targetId', ParseIntPipe) targetId: number,
  ): Promise<ReactionModerationDto[]> {
    return this.reactionsService.listForModeration(parseTargetType(targetType), targetId);
  }

  @Get(':targetType/:targetId')
  @UseGuards(OptionalJwtAuthGuard)
  async getSummary(
    @Param('targetType') targetType: string,
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('characterId') characterId?: string,
    @CurrentUser() user?: UserInfo,
  ): Promise<ReactionSummaryDto> {
    return this.reactionsService.getSummary(
      parseTargetType(targetType),
      targetId,
      user,
      characterId ? parseInt(characterId, 10) || undefined : undefined,
    );
  }

  @Put(':id/hidden')
  @RoleRequired(Role.MODERATOR)
  async setHidden(@Param('id', ParseIntPipe) id: number, @Body() request: ReactionHiddenRequestDto): Promise<void> {
    await this.reactionsService.setHidden(id, request.hidden);
  }
}
