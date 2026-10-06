import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  devIndicators: false,
  turbopack: { root },
  // the story folders (assets, stories, videos …) stay where they are and are served by app/[dir]/[...path]
  serverExternalPackages: ['puppeteer-core'],
};
