export enum TelemetryConsentStatus {
  UNKNOWN = 'unknown',
  GRANTED = 'granted',
  DENIED = 'denied',
}

export function isTelemetryConsentStatus(value: unknown): value is TelemetryConsentStatus {
  return value === TelemetryConsentStatus.UNKNOWN
    || value === TelemetryConsentStatus.GRANTED
    || value === TelemetryConsentStatus.DENIED;
}
