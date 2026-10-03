/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Rails runs on :3000 in development; proxying keeps the browser on one
    // origin so no CORS setup is needed.
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    // Mantine + React is ~170 kB gzipped; charts are split into their own chunk.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
