import { boot } from 'quasar/wrappers';
import { applyStoredThemeMode } from 'src/common/theme';

export default boot(() => {
  applyStoredThemeMode();
});
