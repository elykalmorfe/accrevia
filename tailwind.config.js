export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
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
        canvas: '#F8FAFC', // Crisp cool light slate background (from reference)
        line: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          subtle: '#F1F5F9',
        },
        ink: {
          DEFAULT: '#0F172A', // High contrast slate/black
          muted: '#64748B',  // Slate 500
          subtle: '#94A3B8', // Slate 400
        },
        success: { 50: '#F0FDF4', 100: '#DCFCE7', 600: '#16A34A', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 600: '#D97706', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 100: '#FEE2E2', 600: '#DC2626', 700: '#B91C1C' },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'soft-lg': '0 10px 25px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.02)',
        'brand': '0 8px 24px -4px rgba(37, 99, 235, 0.25)',
      }
    },
  },
  plugins: [],
};

