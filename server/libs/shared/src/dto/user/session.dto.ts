import { Role } from '../../enums/role.enum';
import { SessionCharacterDto } from './session-character.dto';
import { TelemetryConsentStatus } from '../../enums/telemetry-consent-status.enum';

export interface SessionDto {
  id: number;
  role: Role;
  characters: SessionCharacterDto[];
  termsAcceptedAt: string | null;
  telemetryConsentStatus: TelemetryConsentStatus;
  telemetryConsentVersion: number;
  telemetryConsentUpdatedAt: string | null;
}
