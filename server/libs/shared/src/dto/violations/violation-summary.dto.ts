import { PageType } from "@app/shared/enums/page-type.enum";

export interface ViolationSummaryDto {
	id: number;
	pageType: PageType;
	pageId: number;
	reportedBy: string;
	reason: string;
	open: boolean | null;
	createdAt: number;
}
