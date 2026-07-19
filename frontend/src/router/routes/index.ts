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

// 动态路由挂载到 Root 布局下
const rootRoute = coreRoutes.find((r) => r.name === 'Root');
if (rootRoute && rootRoute.children) {
  rootRoute.children.push(...dynamicRoutes);
}

const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  fallbackNotFoundRoute,
];

const coreRouteNames = coreRoutes
  .flatMap((r) => [r.name, ...(r.children?.map((c) => c.name) ?? [])])
  .filter(Boolean) as string[];

export { dynamicRoutes as accessRoutes, coreRouteNames, routes };
