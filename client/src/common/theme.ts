import { Dark, LocalStorage } from 'quasar';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_STORAGE_KEY = 'themeMode';
const DEFAULT_THEME_MODE: ThemeMode = 'system';
const THEME_MODE_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return isThemeMode(value) ? value : DEFAULT_THEME_MODE;
}

export function getStoredThemeMode(): ThemeMode {
  return normalizeThemeMode(LocalStorage.getItem(THEME_MODE_STORAGE_KEY));
}

export function applyThemeMode(mode: ThemeMode): ThemeMode {
  const normalized = normalizeThemeMode(mode);
  Dark.set(normalized === 'system' ? 'auto' : normalized === 'dark');
  return normalized;
}

export function applyStoredThemeMode(): ThemeMode {
  return applyThemeMode(getStoredThemeMode());
}

export function setThemeMode(mode: ThemeMode): ThemeMode {
  const normalized = normalizeThemeMode(mode);
  LocalStorage.set(THEME_MODE_STORAGE_KEY, normalized);
  return applyThemeMode(normalized);
}

export function getNextThemeMode(currentMode?: ThemeMode): ThemeMode {
  const mode = normalizeThemeMode(currentMode || getStoredThemeMode());
  const currentIndex = THEME_MODE_CYCLE.indexOf(mode);
  const nextIndex = (currentIndex + 1) % THEME_MODE_CYCLE.length;
  return THEME_MODE_CYCLE[nextIndex];
}

export function toggleThemeMode(currentMode?: ThemeMode): ThemeMode {
  return setThemeMode(getNextThemeMode(currentMode));
}
