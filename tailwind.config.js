export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#EFF4FB',
          100: '#DCE6F4',
          200: '#B9CCE8',
          500: '#2F5597',
          600: '#1F3F7A',
          700: '#183263',
          800: '#13284F',
          900: '#0E1E3B',
        },
        gold: {
          100: '#F7EBCB',
          200: '#EED79B',
          500: '#C08A1E',
          700: '#7A560F',
        },
        canvas: '#F5F6F8',
        line: {
          DEFAULT: '#E2E5EA',
          strong: '#CBD1DA',
        },
        ink: {
          DEFAULT: '#151B26',
          muted: '#4A5466',
          subtle: '#687284',
        },
        success: { 50: '#ECF7F0', 100: '#CDEBD8', 600: '#1E7A46', 700: '#17633A' },
        warning: { 50: '#FDF5E6', 100: '#F8E3BC', 600: '#A86108', 700: '#7F4A06' },
        danger: { 50: '#FCEEEE', 100: '#F6D3D1', 600: '#B42318', 700: '#912018' },
      },
    },
  },
  plugins: [],
};
