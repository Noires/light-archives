import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import {
  BOOKMARK_TARGET_TYPES,
  BookmarkDto,
  BookmarkRequestDto,
  BookmarkStatusDto,
  BookmarkStatusQueryDto,
  BookmarkTargetType,
} from '@app/shared/dto/social/bookmark.dto';
import { Role } from '@app/shared/enums/role.enum';
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

function parseTargetType(value: string): BookmarkTargetType {
  if (!BOOKMARK_TARGET_TYPES.includes(value as BookmarkTargetType)) {
    throw new BadRequestException('Invalid target type');
  }

  return value as BookmarkTargetType;
}

/** ER2 social: bookmarks ("Merkliste"). Users can delete every bookmark at any time (DSGVO). */
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @RoleRequired(Role.USER)
  async getMine(@CurrentUser() user: UserInfo): Promise<BookmarkDto[]> {
    return this.bookmarksService.getMine(user);
  }

  @Get('status')
  @RoleRequired(Role.USER)
  async getStatus(@Query() query: BookmarkStatusQueryDto, @CurrentUser() user: UserInfo): Promise<BookmarkStatusDto> {
    return this.bookmarksService.getStatus(query.targetType, query.targetId, user);
  }

  @Put()
  @RoleRequired(Role.USER)
  async add(@Body() request: BookmarkRequestDto, @CurrentUser() user: UserInfo): Promise<BookmarkStatusDto> {
    return this.bookmarksService.add(request.targetType, request.targetId, user);
  }

  @Delete(':targetType/:targetId')
  @RoleRequired(Role.USER)
  async remove(
    @Param('targetType') targetType: string,
    @Param('targetId', ParseIntPipe) targetId: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.bookmarksService.remove(parseTargetType(targetType), targetId, user);
  }
}
