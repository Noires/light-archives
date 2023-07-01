import { UserInfo } from '@app/auth/model/user-info';
import { Character, Community, Event, FreeCompany, Image, NoticeboardItem, Story, User, Venue, Violation, WikiPage } from '@app/entity';
import { ViolationReportDto } from '@app/shared/dto/violations/violation-report.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Connection, EntityManager, Repository } from 'typeorm';
import { isQueryFailedError } from '../../../common/db';
import { InjectRepository } from '@nestjs/typeorm';

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

	async getViolations(): Promise<Violation[]> {
		const violations = await this.violationRepo.createQueryBuilder('violation')
			.select(['pageId', 'pageType', 'reportedBy', 'open'])
			.getMany();

		return violations;
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
