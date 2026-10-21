import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL/BASE_PATH are set by the deploy workflow; defaults match local preview.
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
