import type { RouteRecordRaw } from 'vue-router';
import { LOGIN_PATH } from '#/store/auth';
import { $t } from '#/locales';

const MainLayout = () => import('#/layouts/index.vue');
const AuthLayout = () => import('#/layouts/auth.vue');

const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: { hideInMenu: true, title: '404' },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

const coreRoutes: RouteRecordRaw[] = [
  {
    component: MainLayout,
    meta: { title: 'Root' },
    name: 'Root',
    path: '/',
    redirect: '/dashboard/analytics',
    children: [],
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
        meta: { title: $t('page.auth.login') },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
