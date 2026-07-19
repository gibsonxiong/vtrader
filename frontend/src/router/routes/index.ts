import type { RouteRecordRaw } from 'vue-router';
import { coreRoutes, fallbackNotFoundRoute } from './core';

const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  fallbackNotFoundRoute,
];

const coreRouteNames = coreRoutes
  .flatMap((r) => [r.name, ...(r.children?.map((c) => c.name) ?? [])])
  .filter(Boolean) as string[];

const accessRoutes = coreRoutes[0]?.children ?? [];

export { accessRoutes, coreRouteNames, routes };
