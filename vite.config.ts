import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    const port = Number(env.PORT || process.env.PORT || 3000);
    return {
      server: {
        port,
        host: '0.0.0.0',
        strictPort: false,
        // السماح بالنطاقات المُوجّهة (proxied preview hosts) مثل *.e2b.app
        allowedHosts: true,
        cors: true,
      },
      preview: {
        port,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [tailwindcss(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
