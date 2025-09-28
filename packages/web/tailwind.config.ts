import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warmer Beige/Cream Base Palette
        cream: {
          50: '#fefcf7',
          100: '#fdf6e8',
          200: '#faebd0',
          300: '#f5dab0',
          400: '#efc485',
          500: '#e6a85c',
          600: '#d68d3e',
          700: '#ba7332',
          800: '#9c5e2b',
          900: '#804d25',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d2c7',
          300: '#a3b5a3',
          400: '#7d9a7d',
          500: '#5f7f5f',
          600: '#4a654a',
          700: '#3d533d',
          800: '#334433',
          900: '#2a372a',
        },
        lavender: {
          50: '#faf9fc',
          100: '#f3f1f7',
          200: '#e8e3f0',
          300: '#d6cce3',
          400: '#c0abd2',
          500: '#a688bd',
          600: '#8d6ba3',
          700: '#755788',
          800: '#614970',
          900: '#513e5c',
        },
        // Elevator-specific colors using warmer beige/pastel palette
        elevator: {
          shaft: '#f5dab0', // cream-300 (warmer)
          car: '#a688bd', // lavender-500
          'car-moving': '#8d6ba3', // lavender-600
          'doors-open': '#7d9a7d', // sage-400
        },
        passenger: {
          waiting: '#d68d3e', // cream-600 (warmer)
          traveling: '#5f7f5f', // sage-500
        },
      },
      animation: {
        'elevator-move': 'elevator-move 0.5s ease-in-out',
        'door-open': 'door-open 0.3s ease-out',
      },
      keyframes: {
        'elevator-move': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(var(--target-y))' },
        },
        'door-open': {
          '0%': { width: '100%' },
          '100%': { width: '20%' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
