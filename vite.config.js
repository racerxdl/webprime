import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8082,
  },
  build: {
    outDir: 'dist',
  },
});
