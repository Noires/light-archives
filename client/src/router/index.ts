import { route } from 'quasar/wrappers';
import { nextTick } from 'vue';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteLocationNormalized,
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

/** Params that only pick a section of the same page (character tab, venue section). */
const IN_PAGE_PARAMS = ['tab', 'section'];
/** Query keys that load different content (paging, a new search): these still scroll up. */
const CONTENT_QUERY_KEYS = ['page', 'q'];

function sameParam(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * True when a navigation stays on the same page and only switches a section
 * (character `:tab`, venue `:section`) or rewrites filter query params. The
 * page keeps its scroll position then; pages decide themselves whether to
 * nudge it (see components/character/keep-tabs-in-view.ts).
 */
function isInPageNavigation(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  const toLeaf = to.matched[to.matched.length - 1];
  const fromLeaf = from.matched[from.matched.length - 1];
  if (!toLeaf || !fromLeaf) {
    return false;
  }
  // Venue overview and venue sections are separate records with the same page
  // component; after navigation both components are resolved, so compare them.
  const toComponent = toLeaf.components?.default;
  const samePage = toLeaf === fromLeaf || (!!toComponent && toComponent === fromLeaf.components?.default);
  if (!samePage) {
    return false;
  }
  const keys = new Set([ ...Object.keys(to.params), ...Object.keys(from.params) ]);
  for (const key of keys) {
    if (!IN_PAGE_PARAMS.includes(key) && !sameParam(to.params[key], from.params[key])) {
      return false;
    }
  }
  return CONTENT_QUERY_KEYS.every((key) => sameParam(to.query[key], from.query[key]));
}

export default route<StateInterface>(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  router = createRouter({
    scrollBehavior: (to, from, savedPosition) => {
      if (savedPosition) {
        return savedPosition;
      }
      if (isInPageNavigation(to, from)) {
        return false;
      }
      return { left: 0, top: 0 };
    },
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
    const refreshToken = to.query.refreshToken;
    if (typeof token !== 'string' || token.length === 0) {
      return true;
    }

    const api = useApi();
    api.setAccessToken(token);
    if (typeof refreshToken === 'string' && refreshToken.length > 0) {
      api.setRefreshToken(refreshToken);
    }

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
      api.clearTokens();
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
