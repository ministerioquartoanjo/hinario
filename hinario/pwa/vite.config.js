import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        remote: 'remote-control.html'
      }
    }
  },
  publicDir: 'public'
});
