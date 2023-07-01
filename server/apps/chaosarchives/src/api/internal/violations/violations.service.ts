import { UserInfo } from '@app/auth/model/user-info';
import { Character, Community, Event, FreeCompany, Image, NoticeboardItem, Story, User, Venue, Violation, WikiPage } from '@app/entity';
import { ViolationReportDto } from '@app/shared/dto/violations/violation-report.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Connection, EntityManager, Repository } from 'typeorm';
import { escapeForLike, isQueryFailedError } from '../../../common/db';
import { InjectRepository } from '@nestjs/typeorm';
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ViolationSummaryFilterDto } from '@app/shared/dto/violations/violation-summary-filter.dto';

@Injectable()
export class ViolationsService {
	private readonly ENTITIES_BY_PAGE_TYPE = {
		[PageType.PROFILE]: Character,
		[PageType.FREE_COMPANY]: FreeCompany,
		[PageType.COMMUNITY]: Community,
		[PageType.VENUE]: Venue,
		[PageType.EVENT]: Event,
		[PageType.STORY]: Story,
		[PageType.NOTICEBOARD_ITEM]: NoticeboardItem,
		[PageType.WIKI_PAGE]: WikiPage,
		[PageType.IMAGE]: Image,
	};

	constructor(
		private connection: Connection,
		@InjectRepository(Violation) private violationRepo: Repository<Violation>) {}

		
	async getViolationList(filter: ViolationSummaryFilterDto): Promise<PagingResultDto<ViolationSummaryDto>> {
		const query = await this.violationRepo.createQueryBuilder('violation')
			.select(['id', 'pageType', 'pageId', 'reason', 'open', 'createdAt']);

		if (filter.searchQuery) {
			query.andWhere(`(violation.pageType LIKE :searchQuery OR violation.pageId LIKE :searchQuery OR violation.reason LIKE :searchQuery)`,
				{ searchQuery:  `%${escapeForLike(filter.searchQuery)}%` });
		}
		
		if (filter.open && filter.open === 'true' || filter.open === 'false') {
			query.andWhere('violation.open = :open', { open: filter.open });
		}

		const total = await query.getCount();

		if (filter.offset) {
		  query.offset(filter.offset);
		}
	
		if (filter.limit) {
		  query.limit(filter.limit);
		}

		const violations = await query.getRawMany();

		return {total, 
			data: violations.map((violation) => ({
			id: violation.id,
			pageType: violation.pageType,
			pageId: violation.pageId,
			reason: violation.reason,
			open: violation.open,
			createdAt: violation.createdAt.getTime(),
		  }))}
	}

	async reportViolation(report: ViolationReportDto, user: UserInfo): Promise<void> {
		try {
			await this.connection.transaction(async em => {
				const userEntity = await em.getRepository(User).findOne({
					where: {
						id: user.id
					},
					select: [ 'id' ]
				});

				if (!userEntity) {
					// Shouldn't happen
					throw new ForbiddenException('User not found');
				}

				await this.checkPageExists(em, report);

				const violationRepo = em.getRepository(Violation);
				const violation = violationRepo.create({
					pageId: report.pageId,
					pageType: report.pageType,
					reason: report.reason,
					open: true,
					reportedBy: user,
				});

				await violationRepo.save(violation);
			});
		} catch (e) {
			if (isQueryFailedError(e) && e.code === 'ER_DUP_ENTRY') {
				throw new ConflictException('You have already reported this page. Please wait until a moderator reviews your report.');
      }

			// default
			throw e;
		}
	}

	async deleteViolation(id: number): Promise<void> {
		await this.connection.transaction(async em => {
			const violationRepo = em.getRepository(Violation);
			const violation = await violationRepo.createQueryBuilder('violation')
			.where('violation.id = :id', { id })
			.select(['violation.id'])
			.getOne();
	
		  if (!violation) {
			throw new NotFoundException('Story not found');
		  }
	
		  await this.violationRepo.softRemove(violation);
		});
	}
	
	private async checkPageExists(em: EntityManager, report: ViolationReportDto) {
		const entityType = this.ENTITIES_BY_PAGE_TYPE[report.pageType];
		const entityCount = await em.getRepository(entityType).count({
			where: {
				id: report.pageId
			}
		});

		if (entityCount === 0) {
			throw new BadRequestException('Cannot find the page being reported');
		}
	}
}
