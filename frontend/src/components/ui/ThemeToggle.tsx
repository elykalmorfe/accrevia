import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

type ThemeToggleProps = {
  className?: string;
  /** Slightly larger hit target for landing/auth headers. */
  size?: 'sm' | 'md';
};

/** Toggles between light and dark using the same `accrevia_theme` store as Account → Appearance. */
export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';
  const box = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]';

  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-xs transition hover:border-brand-300 hover:bg-brand-tint hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      {isDark ? <SunIcon className={icon} /> : <MoonIcon className={icon} />}
    </button>
  );
}
