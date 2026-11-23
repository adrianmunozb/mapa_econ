import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
// @ts-expect-error Local development middleware is plain Node JavaScript.
import { newsFeedPlugin } from './scripts/news-feed.mjs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), newsFeedPlugin()],
  build: {
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
