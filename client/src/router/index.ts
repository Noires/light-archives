import { route } from 'quasar/wrappers';
import { nextTick } from 'vue';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  Router
} from 'vue-router';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import { StateInterface } from '../store';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

let router: Router;

export default route<StateInterface>(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  router = createRouter({
    scrollBehavior: (_, __, savedPosition) => savedPosition || { left: 0, top: 0 },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE
    ),
  });

  router.beforeEach(async (to) => {
    const token = to.query.token;
    if (typeof token !== 'string' || token.length === 0) {
      return true;
    }

    const api = useApi();
    api.setAccessToken(token);

    try {
      const session = await api.user.getSession();
      store.commit('setUser', session);
      notifySuccess('Du wurdest erfolgreich eingeloggt.');

      const needsTerms = session.characters.length === 0 && !session.termsAcceptedAt;
      if (needsTerms) {
        return { path: '/terms' };
      }

      const hasVerifiedCharacter = session.characters.some((character) => character.verified);
      return { path: hasVerifiedCharacter ? '/' : '/verify' };
    } catch (e) {
      api.setAccessToken(null);
      notifyError(e);
      return { path: '/' };
    }
  });

  router.afterEach((to) => {
    let title = to.meta.title;

    if (typeof title === 'function') {
      title = title(to);
    }

    if (typeof title === 'string') {
      const titleString = title;

      // nextTick is necessary here to properly record browser history
      void nextTick(() => {
        document.title = (titleString ? `${titleString} — ` : '') + 'Elpisgarten';
      });
    }
  });

  return router;
});

export function useRouter() {
  return router;
}
