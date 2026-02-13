import { Role } from '@app/shared/enums/role.enum';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { UserCharacterInfo } from './user-character-info';

export class UserInfo {
  readonly id: number;

  readonly role: Role;

  readonly characters: UserCharacterInfo[];

  readonly termsAcceptedAt: string | null;

  readonly telemetryConsentStatus: TelemetryConsentStatus;
  readonly telemetryConsentVersion: number;
  readonly telemetryConsentUpdatedAt: string | null;

  constructor(properties: Readonly<UserInfo>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
