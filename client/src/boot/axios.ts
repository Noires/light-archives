import errors from '@app/shared/errors';
import axios, { AxiosInstance } from 'axios';
import { boot } from 'quasar/wrappers';
import API from '@common/common/api';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: API;
  }
}

const api = new API();

export function useApi() {
  return api;
}

export default boot(async ({ app, store, router }) => {
  app.config.globalProperties.$axios = axios;

  app.config.globalProperties.$api = api;

  // Set up automatic logout handler when refresh token fails
  api.setLogoutHandler(() => {
    store.commit('setUser', null);
    void router.push('/');
  });

  if (api.hasAccessToken()) {
    try {
      const session = await api.user.getSession();
      store.commit('setUser', session);
    } catch (e) {
      console.log(errors.getMessage(e));
      // If we can't get the session, clear tokens
      api.clearTokens();
    }
  }
});
