import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
     alias: {
      'three': path.resolve(__dirname, 'node_modules/three')
    },
    dedupe: ['three']
  },
  optimizeDeps: {
    include: ['three']
  }
})
