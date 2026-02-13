import { TelemetryConsentStatus } from '../../enums/telemetry-consent-status.enum';
import { IsEnum } from 'class-validator';

export class SetTelemetryConsentDto {
  @IsEnum(TelemetryConsentStatus)
  status: TelemetryConsentStatus;
}
