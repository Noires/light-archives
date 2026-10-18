import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { AlbumEditDto, AlbumImagesDto } from '@app/shared/dto/albums/album-edit.dto';
import { AlbumDto, AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { AlbumsFilterDto } from '@app/shared/dto/albums/albums-filter.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AlbumsService } from './albums.service';

/** ER2 round 2: gallery albums. Reads are public, writes are owner only. */
@Controller('albums')
export class AlbumsController {
  constructor(private albumsService: AlbumsService) {}

  @Get()
  async getAlbums(@Query() filter: AlbumsFilterDto): Promise<AlbumSummaryDto[]> {
    return this.albumsService.getAlbums(filter.characterId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getAlbum(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: UserInfo): Promise<AlbumDto> {
    return this.albumsService.getAlbum(id, user);
  }

  @Post()
  @RoleRequired(Role.USER)
  async createAlbum(@Body() request: AlbumEditDto, @CurrentUser() user: UserInfo): Promise<IdWrapper> {
    return this.albumsService.createAlbum(request, user);
  }

  @Put(':id')
  @RoleRequired(Role.USER)
  async editAlbum(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: AlbumEditDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.albumsService.editAlbum(id, request, user);
  }

  @Put(':id/images')
  @RoleRequired(Role.USER)
  async setAlbumImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: AlbumImagesDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.albumsService.setAlbumImages(id, request.imageIds, user);
  }

  @Delete(':id')
  @RoleRequired(Role.USER)
  async deleteAlbum(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
    await this.albumsService.deleteAlbum(id, user);
  }
}
