/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dce5f3',
          200: '#c2d2ec',
          300: '#94b1de',
          400: '#5f87c9',
          500: '#3e63ad',
          600: '#2e4d8f',
          700: '#1e3a6e',
          800: '#15294f',
          900: '#0d1b38',
          950: '#081127',
        },
        teal: {
          50: '#effcf8',
          100: '#cbf7ed',
          200: '#97ede0',
          300: '#5ddccd',
          400: '#2cc3b6',
          500: '#14a89c',
          600: '#0d8780',
          700: '#106b67',
          800: '#135554',
          900: '#134748',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 27, 56, 0.06), 0 1px 2px rgba(15, 27, 56, 0.04)',
        'card-hover': '0 8px 24px rgba(15, 27, 56, 0.08), 0 2px 6px rgba(15, 27, 56, 0.05)',
      },
    },
  },
  plugins: [],
};
