import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import { Role } from '@app/shared/enums/role.enum';
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { WikiMentionsDto } from '@app/shared/dto/wiki/wiki-mentions.dto';
import { WikiPageListItemDto } from '@app/shared/dto/wiki/wiki-page-list-item.dto';
import { WikiPageRevisionDto, WikiPageRevisionSummaryDto } from '@app/shared/dto/wiki/wiki-page-revision.dto';
import { WikiRestoreRequestDto } from '@app/shared/dto/wiki/wiki-restore-request.dto';
import { WikiService } from './wiki.service';

@Controller('wiki')
export class WikiController {
	constructor(private wikiService: WikiService) { }

	// ER2-609: published pages for the /wiki index, most recently edited first
	@Get()
	async getWikiPageList(@Query('limit') limit?: string): Promise<WikiPageListItemDto[]> {
		return this.wikiService.getWikiPageList(limit ? parseInt(limit, 10) : undefined);
	}

	// ER2-608: published content linking to this page ("Erwähnt in")
	@Get(':title/mentions')
	async getWikiPageMentions(@Param('title') title: string): Promise<WikiMentionsDto> {
		return this.wikiService.getWikiPageMentions(title);
	}

	// ER2 round 2: revision history (newest first), same visibility as the page
	@Get(':title/revisions')
	@UseGuards(OptionalJwtAuthGuard)
	async getWikiPageRevisions(@Param('title') title: string, @CurrentUser() user?: UserInfo): Promise<WikiPageRevisionSummaryDto[]> {
		return this.wikiService.getRevisions(title, user);
	}

	@Get(':title/revisions/:revisionId')
	@UseGuards(OptionalJwtAuthGuard)
	async getWikiPageRevision(
		@Param('title') title: string,
		@Param('revisionId', ParseIntPipe) revisionId: number,
		@CurrentUser() user?: UserInfo,
	): Promise<WikiPageRevisionDto> {
		return this.wikiService.getRevision(title, revisionId, user);
	}

	// Same permission as editing; the restore is recorded as a new revision (its id is returned)
	@Post(':title/revisions/:revisionId/restore')
	@RoleRequired(Role.TRUSTED)
	async restoreWikiPageRevision(
		@Param('title') title: string,
		@Param('revisionId', ParseIntPipe) revisionId: number,
		@Body() request: WikiRestoreRequestDto,
		@CurrentUser() user: UserInfo,
	): Promise<IdWrapper> {
		return this.wikiService.restoreRevision(title, revisionId, user, request?.changeNote, request?.characterId);
	}

	@Get('by-title/:title')
	@UseGuards(OptionalJwtAuthGuard)
	async getWikiPageByTitle(@Param('title') title: string, @CurrentUser() user?: UserInfo): Promise<WikiPageDto> {
		return this.wikiService.getWikiPageByTitle(title, user);
	}

	@Get(':id')
	@UseGuards(OptionalJwtAuthGuard)
	async getWikiPageById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: UserInfo): Promise<WikiPageDto> {
		return this.wikiService.getWikiPageById(id, user);
	}

	@Post()
	@RoleRequired(Role.TRUSTED)
	async createWikiPage(@Body() wikiPage: WikiPageDto, @CurrentUser() user: UserInfo): Promise<IdWrapper> {
		if (wikiPage.id !== undefined) {
			throw new BadRequestException('ID is forbidden for create request');
		}

		return this.wikiService.createWikiPage(wikiPage as WikiPageDto & { id: undefined }, user);
	}

	@Put(':id')
	@RoleRequired(Role.TRUSTED)
	async editWikiPage(@Param('id', ParseIntPipe) id: number, @Body() wikiPage: WikiPageDto, @CurrentUser() user: UserInfo): Promise<void> {
		const wikiPageToEdit = new WikiPageDto({...wikiPage, id}) as WikiPageDto & { id: number };
		await this.wikiService.editWikiPage(wikiPageToEdit, user);
	}

	@Delete(':id')
	@RoleRequired(Role.TRUSTED)
	async deleteWikiPage(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
		await this.wikiService.deleteWikiPage(id, user);
	}
}
