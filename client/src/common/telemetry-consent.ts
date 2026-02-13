import { TelemetryConsentStatus, isTelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { LocalStorage } from 'quasar';

const TELEMETRY_CONSENT_STATUS_KEY = 'telemetryConsentStatus';
const TELEMETRY_CONSENT_VERSION_KEY = 'telemetryConsentVersion';
const TELEMETRY_CONSENT_UPDATED_AT_KEY = 'telemetryConsentUpdatedAt';

export const TELEMETRY_CONSENT_VERSION = 1;

export interface TelemetryConsentPreference {
  status: TelemetryConsentStatus;
  version: number;
  updatedAt: string | null;
}

export function getStoredTelemetryConsent(): TelemetryConsentPreference {
  const statusValue = LocalStorage.getItem(TELEMETRY_CONSENT_STATUS_KEY);
  const versionValue = LocalStorage.getItem(TELEMETRY_CONSENT_VERSION_KEY);
  const updatedAtValue = LocalStorage.getItem(TELEMETRY_CONSENT_UPDATED_AT_KEY);
  const status = isTelemetryConsentStatus(statusValue) ? statusValue : TelemetryConsentStatus.UNKNOWN;
  const version = typeof versionValue === 'number' ? versionValue : TELEMETRY_CONSENT_VERSION;
  const updatedAt = typeof updatedAtValue === 'string' ? updatedAtValue : null;

  return normalizeTelemetryConsent({
    status,
    version,
    updatedAt,
  });
}

export function normalizeTelemetryConsent(
  preference: TelemetryConsentPreference,
): TelemetryConsentPreference {
  if (preference.version !== TELEMETRY_CONSENT_VERSION) {
    return {
      status: TelemetryConsentStatus.UNKNOWN,
      version: TELEMETRY_CONSENT_VERSION,
      updatedAt: preference.updatedAt,
    };
  }

  return preference;
}

export function saveTelemetryConsent(preference: TelemetryConsentPreference): void {
  LocalStorage.set(TELEMETRY_CONSENT_STATUS_KEY, preference.status);
  LocalStorage.set(TELEMETRY_CONSENT_VERSION_KEY, preference.version);
  if (preference.updatedAt) {
    LocalStorage.set(TELEMETRY_CONSENT_UPDATED_AT_KEY, preference.updatedAt);
  } else {
    LocalStorage.remove(TELEMETRY_CONSENT_UPDATED_AT_KEY);
  }
}

export function shouldPromptTelemetryConsent(preference: TelemetryConsentPreference): boolean {
  return preference.status === TelemetryConsentStatus.UNKNOWN
    || preference.version !== TELEMETRY_CONSENT_VERSION;
}
