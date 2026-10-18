import { reactive } from 'vue';
import { ThemeMode, getNextThemeMode, getStoredThemeMode, toggleThemeMode } from 'src/common/theme';

// Theme toggle state shared by the top bar and the mobile "Mehr" sheet, so
// both show the same mode. Persistence and Dark switching stay in
// src/common/theme.ts.

export const shellTheme = reactive({
  mode: getStoredThemeMode(),
});

export function toggleShellTheme(): void {
  shellTheme.mode = toggleThemeMode(shellTheme.mode);
}

export function themeModeLabel(mode: ThemeMode): string {
  if (mode === 'light') {
    return 'Hell';
  }
  if (mode === 'dark') {
    return 'Dunkel';
  }
  return 'System';
}

export function themeIcon(mode: ThemeMode, isDark: boolean): string {
  if (mode === 'system') {
    return 'brightness_auto';
  }
  return isDark ? 'dark_mode' : 'light_mode';
}

export function themeTooltip(mode: ThemeMode, isDark: boolean): string {
  return `Darstellung: ${themeModeLabel(mode)} (aktiv: ${isDark ? 'dunkel' : 'hell'}). Klick: ${themeModeLabel(getNextThemeMode(mode))}`;
}

export function themeAriaLabel(mode: ThemeMode): string {
  return `Darstellung wechseln. Als Nächstes: ${themeModeLabel(getNextThemeMode(mode))}`;
}
