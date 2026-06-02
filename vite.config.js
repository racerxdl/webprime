import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 8082,
  },
  build: {
    outDir: 'dist',
  },
});
