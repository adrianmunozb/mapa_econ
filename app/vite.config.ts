import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
// @ts-expect-error Local development middleware is plain Node JavaScript.
import { newsFeedPlugin } from './scripts/news-feed.mjs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), newsFeedPlugin()],
  build: {
    cssCodeSplit: false,
    // Inline the two font files so the single-file build keeps its typography offline.
    assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? true : undefined),
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
