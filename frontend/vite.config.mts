import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function getConfFiles() {
  const script = process.env.npm_lifecycle_script as string;
  const reg = /--mode ([\d_a-z]+)/;
  const result = reg.exec(script);
  let mode = 'production';
  if (result) mode = result[1] as string;
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
}

function loadEnv() {
  let envConfig: Record<string, string> = {};
  const root = process.cwd();
  for (const confFile of getConfFiles()) {
    try {
      const confFilePath = join(root, confFile);
      if (existsSync(confFilePath)) {
        const envPath = readFileSync(confFilePath, { encoding: 'utf8' });
        const parsed = dotenv.parse(envPath);
        envConfig = { ...envConfig, ...parsed };
      }
    } catch { /* skip missing files */ }
  }
  return envConfig;
}

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv();
  const port = Number(env.VITE_PORT) || 8000;
  const base = env.VITE_BASE || '/';

  return {
    base,
    plugins: [vue({ script: { defineModel: true } }), vueJsx()],
    resolve: {
      alias: {
        '#': resolve(__dirname, 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    server: {
      host: true,
      port,
      proxy: {
        '/api': {
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          target: 'http://localhost:3000',
          ws: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE || 'VTrader'),
      'import.meta.env.VITE_APP_NAMESPACE': JSON.stringify(env.VITE_APP_NAMESPACE || 'vtrader'),
    },
  };
});
