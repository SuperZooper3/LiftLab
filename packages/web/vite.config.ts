import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // Change 'LiftLab' to your actual repository name
  base: process.env.NODE_ENV === 'production' ? '/LiftLab/' : '/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          konva: ['konva', 'react-konva'],
          simulation: ['@lift-lab/sim']
        }
      }
    }
  },
  // Ensure proper asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif']
});
