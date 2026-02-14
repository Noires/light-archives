import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import * as Sentry from '@sentry/vue';
import { App } from 'vue';
import { Router } from 'vue-router';

let app: App | null = null;
let router: Router | null = null;
let sentryInitialized = false;
const DEFAULT_REPLAY_SESSION_SAMPLE_RATE = process.env.NODE_ENV === 'production' ? 0 : 1;
const DEFAULT_REPLAY_ON_ERROR_SAMPLE_RATE = 1;

function getSentryDsn(): string {
  return (process.env.SENTRY_DSN || '').trim();
}

function parseSampleRate(rawValue: string | undefined, fallback: number): number {
  if (!rawValue || !rawValue.trim()) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, parsedValue));
}

function getReplaySessionSampleRate(): number {
  return parseSampleRate(process.env.SENTRY_REPLAY_SESSION_SAMPLE_RATE, DEFAULT_REPLAY_SESSION_SAMPLE_RATE);
}

function getReplayOnErrorSampleRate(): number {
  return parseSampleRate(process.env.SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE, DEFAULT_REPLAY_ON_ERROR_SAMPLE_RATE);
}

export function isSentryConfigured(): boolean {
  return getSentryDsn().length > 0;
}

export function registerSentryRuntime(vueApp: App, vueRouter: Router): void {
  app = vueApp;
  router = vueRouter;
}

export async function syncSentryWithConsent(
  consentStatus: TelemetryConsentStatus,
  previousConsentStatus?: TelemetryConsentStatus,
): Promise<void> {
  if (!isSentryConfigured()) {
    return;
  }

  if (consentStatus === TelemetryConsentStatus.GRANTED) {
    initSentryIfNeeded();
    return;
  }

  if (previousConsentStatus === TelemetryConsentStatus.GRANTED && sentryInitialized) {
    await Sentry.close(2000);

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

function initSentryIfNeeded(): void {
  if (sentryInitialized || !app || !router) {
    return;
  }

  const activeRouter = router;
  const replaySessionSampleRate = getReplaySessionSampleRate();
  const replayOnErrorSampleRate = getReplayOnErrorSampleRate();
  const integrations = [
    Sentry.browserTracingIntegration({ router: activeRouter }),
  ];

  if (replaySessionSampleRate > 0 || replayOnErrorSampleRate > 0) {
    integrations.push(Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }));
  }

  Sentry.init({
    app,
    dsn: getSentryDsn(),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || undefined,
    integrations,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: replaySessionSampleRate,
    replaysOnErrorSampleRate: replayOnErrorSampleRate,
    tracePropagationTargets: ['localhost', /^\/api\//],
    sendDefaultPii: false,
    beforeSend(event) {
      sanitizeSentryEvent(event);
      return event;
    },
  });

  sentryInitialized = true;
}

function sanitizeSentryEvent(event: Sentry.Event): void {
  if (event.request?.url) {
    event.request.url = event.request.url.split('?')[0];
  }

  if (event.request?.headers) {
    delete event.request.headers.Authorization;
    delete event.request.headers.authorization;
    delete event.request.headers.Cookie;
    delete event.request.headers.cookie;
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
}
