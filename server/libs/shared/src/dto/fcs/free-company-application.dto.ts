import { FreeCompanyApplicationStatus } from '@app/shared/enums/free-company-application-status.enum';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export const FC_APPLICATION_MESSAGE_MAX_LENGTH = 1000;

/** ER2 round 2: body of POST /free-companies/:id/applications. */
export class FreeCompanyApplyRequestDto {
	@Type(() => Number)
	@IsNumber()
	characterId: number;

	@IsString()
	@IsOptional()
	@MaxLength(FC_APPLICATION_MESSAGE_MAX_LENGTH)
	message?: string;
}

/** ER2 round 2: entry of GET /free-companies/:id/applications (FC managers only). */
export interface FreeCompanyApplicationDto {
	id: number;
	characterId: number;
	name: string;
	server: string;
	avatar: string;
	message: string | null;
	status: FreeCompanyApplicationStatus;
	/** epoch millis */
	createdAt: number;
	/** epoch millis */
	decidedAt: number | null;
	decidedBy: string | null;
}
