import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://naturizable.com',
  output: 'hybrid',
  adapter: netlify(),

  server: { host: true },

  // Comprime HTML en producción
  compressHTML: true,

  build: {
    // Inline CSS pequeño directamente en <head> — menos requests
    inlineStylesheets: 'auto',
  },

  vite: {
    ssr: {
      external: ['@libsql/client', 'puppeteer-core', '@sparticuz/chromium'],
    },
    build: {
      // Minificación agresiva
      minify: 'esbuild',
      cssMinify: true,
      // Divide chunks grandes para mejor caching
      rollupOptions: {
        external: ['@sparticuz/chromium'],
        output: {
          manualChunks: {
            lenis: ['lenis'],
          },
        },
      },
    },
  },
});
