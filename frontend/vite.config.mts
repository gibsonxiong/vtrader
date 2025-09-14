import { defineConfig } from '@vtrader/vite-config';

export default defineConfig(async () => {
  return {
    application: {
      nestBackend: true,
      nestBackendOptions: {
        port: 3000,
        backendPackage: '@vtrader/backend',
        script: 'start:dev',
        verbose: true,
      },
    },
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
