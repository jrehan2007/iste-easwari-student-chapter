/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        turkish: { DEFAULT: '#00A9CE', dark: '#00758E', light: '#7FDCEF', mist: '#E8F7FB' },
        ink: '#0E1B33',
        night: { DEFAULT: '#0A1220', soft: '#111C2E', line: '#1E2E45' },
        gold: { DEFAULT: '#C9A227', light: '#E8CE72', deep: '#8C6D0F' },
      },
      fontFamily: {
        serif: ['"Times New Roman"', 'Times', 'serif'],
        display: ['"Cormorant Garamond"', 'Fraunces', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}
