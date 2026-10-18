import { IsOptional } from "class-validator";
import { EventRegistrationKind } from "../../enums/event-registration-kind.enum";
import { ImageSummaryDto } from "../image/image-summary.dto";
import { BaseEventDto } from "./base-event.dto";
import { EventParticipantDto } from "./event-participant.dto";
import { EventOccurrenceDto } from "./event-series.dto";

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

  // ER2-801 (optional; absent on older API versions)
  @IsOptional()
  goingCount?: number;

  @IsOptional()
  interestedCount?: number;

  // Registration kind per own character ID (only the current user's characters)
  @IsOptional()
  myRegistrationKinds?: { [characterId: number]: EventRegistrationKind };

  // ER2-804 (optional): German label of the series, e.g. "Jeden Samstag · 20:00"
  @IsOptional()
  seriesLabel?: string;

  @IsOptional()
  nextOccurrences?: EventOccurrenceDto[];

	constructor(properties?: Readonly<EventDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
