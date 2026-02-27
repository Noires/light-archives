import { IsOptional } from "class-validator";
import { ImageSummaryDto } from "../image/image-summary.dto";
import { BaseEventDto } from "./base-event.dto";
import { EventParticipantDto } from "./event-participant.dto";

export class EventDto extends BaseEventDto {
	// Read only
	@IsOptional()
	images: ImageSummaryDto[];

  @IsOptional()
  registrationOpen?: boolean;

  @IsOptional()
  registrationDeadlineAt?: number | null;

  @IsOptional()
  participantCount?: number;

  @IsOptional()
  userRegistered?: boolean;

  @IsOptional()
  myRegistrationCharacterIds?: number[];

  @IsOptional()
  canManageParticipants?: boolean;

  @IsOptional()
  participants?: EventParticipantDto[];

	constructor(properties?: Readonly<EventDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
