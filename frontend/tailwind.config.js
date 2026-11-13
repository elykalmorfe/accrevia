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
        // Institutional blue brand centered on #005A9C.
        brand: {
          50: '#F0F6FB',
          100: '#D9E8F5',
          200: '#B3D1EB',
          300: '#7CB3DC',
          400: '#3D8FC7',
          500: '#1A74B5',
          600: '#005A9C',
          700: '#004A82',
          800: '#003B68',
          900: '#002F54',
          950: '#001A30',
        },
        gold: {
          100: '#D9E8F5',
          200: '#B3D1EB',
          500: '#1A74B5',
          700: '#004A82',
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
        // Semantic tones stay on the #005A9C family.
        success: { 50: '#F0F6FB', 100: '#D9E8F5', 600: '#005A9C', 700: '#004A82' },
        warning: { 50: '#F0F6FB', 100: '#D9E8F5', 600: '#1A74B5', 700: '#003B68' },
        danger: { 50: '#F0F6FB', 100: '#D9E8F5', 600: '#003B68', 700: '#001A30' },
      },
      boxShadow: {
        '2xs': '0 1px 0 0 rgb(var(--shadow-color) / 0.04)',
        'xs': '0 1px 2px 0 rgb(var(--shadow-color) / 0.06)',
        'soft': '0 4px 20px -2px rgb(var(--shadow-color) / var(--shadow-strength))',
        'soft-lg': '0 12px 32px -6px rgb(var(--shadow-color) / calc(var(--shadow-strength) * 2)), 0 4px 8px -4px rgb(var(--shadow-color) / var(--shadow-strength))',
        'brand': '0 8px 24px -4px rgba(0, 90, 156, 0.28)',
        'glow': '0 0 0 1px rgb(0 90 156 / 0.16), 0 4px 14px -4px rgb(0 90 156 / 0.22)',
      }
    },
  },
  plugins: [],
};
