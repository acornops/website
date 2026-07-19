import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://acornops.dev',
  output: 'static',
  integrations: [sitemap()],
  compressHTML: true,
  vite: {
    build: {
      assetsInlineLimit: 2048
    }
  }
});
