import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Must match the key read by the inline script in `index.html`. */
const STORAGE_KEY = 'accrevia_theme';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'light';
  } catch {
    return 'light';
  }
}

let mode: ThemeMode = readMode();
const listeners = new Set<() => void>();

export function resolveTheme(value: ThemeMode): ResolvedTheme {
  return value === 'system' ? (darkQuery().matches ? 'dark' : 'light') : value;
}

export function applyTheme(value: ThemeMode = mode) {
  const resolved = resolveTheme(value);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function setThemeMode(value: ThemeMode) {
  mode = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable: theme still applies for this session */
  }
  applyTheme(value);
  emit();
}

darkQuery().addEventListener('change', () => {
  if (mode !== 'system') return;
  applyTheme();
  emit();
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => mode);
  const resolved = useSyncExternalStore(subscribe, () => resolveTheme(mode));
  return { mode: current, resolved, setMode: setThemeMode };
}
