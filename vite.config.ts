import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Use repo name as base path when deploying to GitHub Pages
      base: '/Prism/',
      clearScreen: false,
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: false
        },
        proxy: {
          '/api': {
            target: 'http://localhost:4001',
            changeOrigin: true,
          }
        }
      },
      css: {
        postcss: {
          plugins: [
            require('tailwindcss'),
            require('autoprefixer'),
          ]
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
