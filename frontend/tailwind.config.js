const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Electric Royal Blue (Reference primary)
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        gold: {
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          700: '#B45309',
        },
        // Theme-aware tokens; values live in index.css (:root and .dark).
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          raised: token('surface-raised'),
        },
        'brand-tint': token('brand-tint'),
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
          subtle: token('line-subtle'),
        },
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          subtle: token('ink-subtle'),
        },
        success: { 50: '#F0FDF4', 100: '#DCFCE7', 600: '#16A34A', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 600: '#D97706', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 100: '#FEE2E2', 600: '#DC2626', 700: '#B91C1C' },
      },
      boxShadow: {
        '2xs': '0 1px 0 0 rgb(var(--shadow-color) / 0.04)',
        'xs': '0 1px 2px 0 rgb(var(--shadow-color) / 0.06)',
        'soft': '0 4px 20px -2px rgb(var(--shadow-color) / var(--shadow-strength))',
        'soft-lg': '0 12px 32px -6px rgb(var(--shadow-color) / calc(var(--shadow-strength) * 2)), 0 4px 8px -4px rgb(var(--shadow-color) / var(--shadow-strength))',
        'brand': '0 8px 24px -4px rgba(37, 99, 235, 0.25)',
        'glow': '0 0 0 1px rgb(59 130 246 / 0.15), 0 6px 20px -4px rgb(59 130 246 / 0.35)',
      }
    },
  },
  plugins: [],
};

