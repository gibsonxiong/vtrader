import type { RouteRecordRaw } from 'vue-router';
import { LOGIN_PATH } from '#/store/auth';

const MobileLayout = () => import('#/layouts/index.vue');
const AuthLayout = () => import('#/layouts/auth.vue');

const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: { hideInMenu: true, title: '404' },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

const coreRoutes: RouteRecordRaw[] = [
  {
    component: MobileLayout,
    meta: { title: 'Root' },
    name: 'Root',
    path: '/',
    redirect: '/market-data/overview',
    children: [
      {
        name: 'MarketOverview',
        path: '/market-data/overview',
        component: () => import('#/views/market-data/overview/index.vue'),
        meta: { title: '数据大纲' },
      },
      {
        name: 'MarketList',
        path: '/market-data/list',
        component: () => import('#/views/market-data/list/index.vue'),
        meta: { title: '行情列表' },
      },
      {
        name: 'BacktestHistory',
        path: '/backtesting/history',
        component: () => import('#/views/backtesting/history/index.vue'),
        meta: { title: '回测历史' },
      },
      {
        name: 'BacktestResult',
        path: '/backtesting/result',
        component: () => import('#/views/backtesting/result/index.vue'),
        meta: { title: '回测结果' },
      },
    ],
  },
  {
    component: AuthLayout,
    meta: { title: 'Authentication' },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: { title: '登录' },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
