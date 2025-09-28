import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        elevator: {
          shaft: '#e5e7eb',
          car: '#3b82f6',
          'car-moving': '#1d4ed8',
          'doors-open': '#10b981',
        },
        passenger: {
          waiting: '#ef4444',
          traveling: '#f59e0b',
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
