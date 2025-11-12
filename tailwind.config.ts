import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      colors: {
        water: {
          50: '#f2fbff',
          100: '#e6f7ff',
          200: '#cceeff',
          300: '#99ddff',
          400: '#66ccff',
          500: '#33bbff',
          600: '#1aa3e6',
          700: '#1480b3',
          800: '#0e5d80',
          900: '#093a4d',
        },
      },
    },
  },
  darkMode: 'class',
} satisfies Config
