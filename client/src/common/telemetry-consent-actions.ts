import API from '@common/common/api';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { StateInterface } from 'src/store';
import { Store } from 'vuex';

export async function persistTelemetryConsent(
  api: API,
  store: Store<StateInterface>,
  status: TelemetryConsentStatus,
): Promise<void> {
  if (store.state.user) {
    await api.user.setTelemetryConsent(status);
    const session = await api.user.getSession();
    store.commit('setUser', session);
    return;
  }

  store.commit('setTelemetryConsent', { status });
}
