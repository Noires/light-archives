import * as Sentry from '@sentry/nestjs';

const DEFAULT_TRACE_SAMPLE_RATE = 0.05;

const dsn = (process.env.SENTRY_DSN_CHAOSARCHIVES || process.env.SENTRY_DSN || '').trim();
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const release = process.env.SENTRY_RELEASE || undefined;
const tracesSampleRate = parseSampleRate(
  process.env.SENTRY_TRACES_SAMPLE_RATE_CHAOSARCHIVES || process.env.SENTRY_TRACES_SAMPLE_RATE,
  DEFAULT_TRACE_SAMPLE_RATE,
);

Sentry.init({
  dsn: dsn || undefined,
  enabled: dsn.length > 0,
  environment,
  release,
  initialScope: {
    tags: {
      service: 'chaosarchives',
    },
  },
  sendDefaultPii: false,
  tracesSampleRate,
  beforeSend(event) {
    sanitizeSentryEvent(event);
    return event;
  },
  beforeSendTransaction(event) {
    sanitizeSentryEvent(event);
    return event;
  },
});

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

function sanitizeSentryEvent(event: Sentry.Event): void {
  if (event.request?.url) {
    event.request.url = event.request.url.split('?')[0];
  }

  if (event.request?.headers) {
    delete event.request.headers.Authorization;
    delete event.request.headers.authorization;
    delete event.request.headers.Cookie;
    delete event.request.headers.cookie;
    delete event.request.headers['X-Forwarded-For'];
    delete event.request.headers['x-forwarded-for'];
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
}
