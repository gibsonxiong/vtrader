import type { PluginOption } from 'vite';
import type { NestBackendPluginOptions } from '../typing';

import { colors, consola, execa, getPackage } from '@vtrader/node-utils';
import getPort from 'get-port';

export const viteNestBackendPlugin = ({
  backendPackage = '@vtrader/backend',
  script = 'start:dev',
  port = 3000,
  verbose = true,
}: NestBackendPluginOptions = {}): PluginOption => {
  let child: any;

  return {
    name: 'vite:nest-backend',
    enforce: 'pre',
    async configureServer(server) {
      const availablePort = await getPort({ port });
      if (availablePort !== port) {
        return;
      }

      const pkg = await getPackage(backendPackage);
      if (!pkg) {
        consola.log(`Package ${backendPackage} not found. Skip Nest backend.`);
        return;
      }

      const env = { ...process.env, PORT: String(port) };
      child = execa('pnpm', ['run', script], {
        cwd: pkg.dir,
        env,
      });

      if (verbose) {
        child.stdout?.on('data', (d: any) => process.stdout.write(d));
        child.stderr?.on('data', (d: any) => process.stderr.write(d));
      }

      child.on('close', (code: number) => {
        verbose && consola.info(`Nest backend exited with code ${code}`);
      });

      const _printUrls = server.printUrls;
      server.printUrls = () => {
        _printUrls();
        consola.log(
          `  ${colors.green('➜')}  ${colors.bold('Nest Backend')}: ${colors.cyan(`http://localhost:${port}`)}`,
        );
        consola.log(
          `  ${colors.green('➜')}  ${colors.bold('Swagger')}: ${colors.cyan(`http://localhost:${port}/api`)}`,
        );
      };

      const stop = () => {
        if (child) {
          try {
            child.kill();
          } catch {}
          child = undefined;
        }
      };
      server.httpServer?.once('close', stop);
      process.on('exit', stop);
    },
  };
};