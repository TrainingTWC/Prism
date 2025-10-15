/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#4DD0E1',
        'neutral-bg': '#F6F7FB',
        'neutral-dark': '#0B0E16',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Geologica', 'Tilt Prism', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionDuration: {
        150: '150ms',
      }
    },
  },
  plugins: [],
}