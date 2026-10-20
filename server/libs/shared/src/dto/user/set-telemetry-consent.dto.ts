import { IsEnum } from 'class-validator';
import { TelemetryConsentStatus } from '../../enums/telemetry-consent-status.enum';

export class SetTelemetryConsentDto {
  @IsEnum(TelemetryConsentStatus)
  status: TelemetryConsentStatus;
}
