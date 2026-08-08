import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueDevTools({
      launchEditor: 'C:\\Users\\GibsonXiong\\AppData\\Local\\Programs\\Trae\\bin\\trae.cmd',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/variables.less";`,
        javascriptEnabled: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@vtrader/backend/api'],
  },
})
