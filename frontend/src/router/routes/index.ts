import type { RouteRecordRaw } from 'vue-router';
import { coreRoutes, fallbackNotFoundRoute } from './core';
import dashboardRoutes from './modules/dashboard';
import marketDataRoutes from './modules/market-data';
import backtestingRoutes from './modules/backtesting';

const dynamicRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes,
  ...marketDataRoutes,
  ...backtestingRoutes,
];

const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...dynamicRoutes,
  fallbackNotFoundRoute,
];

const coreRouteNames = coreRoutes
  .flatMap((r) => [r.name, ...(r.children?.map((c) => c.name) ?? [])])
  .filter(Boolean) as string[];

export { dynamicRoutes as accessRoutes, coreRouteNames, routes };
