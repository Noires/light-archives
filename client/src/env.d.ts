declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    SENTRY_DSN: string | undefined;
    SENTRY_ENVIRONMENT: string | undefined;
    SENTRY_RELEASE: string | undefined;
    SENTRY_REPLAY_SESSION_SAMPLE_RATE: string | undefined;
    SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE: string | undefined;
  }
}
