// ELPIS-219 — Register custom Vue directives globally.
//
// The directive is registered without the `v-` prefix; templates use it as
// `v-elpis-save-pulse="counter"`. Add new directives to this boot file rather
// than per-component `directives:` options so they remain available across the
// 14+ edit pages that opt in.

import { boot } from 'quasar/wrappers';
import elpisSavePulse from 'src/directives/elpis-save-pulse';

export default boot(({ app }) => {
  app.directive('elpis-save-pulse', elpisSavePulse);
});
