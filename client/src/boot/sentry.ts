import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { boot } from 'quasar/wrappers';
import { registerSentryRuntime, syncSentryWithConsent } from 'src/common/sentry';
import { StateInterface } from 'src/store';

export default boot<StateInterface>(({ app, store, router }) => {
  registerSentryRuntime(app, router);
  void syncSentryWithConsent(store.state.telemetryConsent.status);

  store.watch(
    (state) => state.telemetryConsent.status,
    (status: TelemetryConsentStatus, previousStatus: TelemetryConsentStatus) => {
      if (status === previousStatus) {
        return;
      }

      void syncSentryWithConsent(status, previousStatus);
    },
  );
});
