import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Variáveis de ambiente expostas ao cliente
        'import.meta.env.VITE_API_MODE': JSON.stringify(env.VITE_API_MODE || 'demo'),
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || ''),
        'import.meta.env.VITE_COPERNICUS_USERNAME': JSON.stringify(env.VITE_COPERNICUS_USERNAME || ''),
        'import.meta.env.VITE_COPERNICUS_PASSWORD': JSON.stringify(env.VITE_COPERNICUS_PASSWORD || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild'
      }
    };
});
