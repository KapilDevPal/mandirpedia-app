/** Pure theme-setting helpers (no React Native imports; unit-tested in Node). */
export type ThemeSetting = 'light' | 'dark' | 'system';

/** Light is the default. Retired values (v1 'paper', a light theme) and unknown values map to light. */
export function normaliseTheme(value: unknown): ThemeSetting {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'light';
}
