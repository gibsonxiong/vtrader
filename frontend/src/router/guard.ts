import type { Router } from 'vue-router';
import { useAuthStore, LOGIN_PATH } from '#/store/auth';
import { coreRouteNames } from './routes';

function createRouterGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const authStore = useAuthStore();

    // Allow core routes (login, 404) without auth
    if (coreRouteNames.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && authStore.accessToken) {
        return decodeURIComponent(
          (to.query?.redirect as string) || '/dashboard/analytics',
        );
      }
      return true;
    }

    // Not logged in → redirect to login
    if (!authStore.accessToken) {
      if (to.meta.ignoreAccess) return true;
      return {
        path: LOGIN_PATH,
        query: to.fullPath === '/dashboard/analytics'
          ? {}
          : { redirect: encodeURIComponent(to.fullPath) },
        replace: true,
      };
    }

    // First access: fetch user info
    if (!authStore.accessChecked) {
      try {
        const userInfo = await authStore.fetchUserInfo();
        authStore.accessChecked = true;

        const redirectPath = from.query.redirect
          ? (from.query.redirect as string)
          : userInfo?.homePath
            ? userInfo.homePath
            : to.fullPath;

        if (to.path === '/' || redirectPath !== to.fullPath) {
          return { ...router.resolve(decodeURIComponent(redirectPath)), replace: true };
        }
      } catch {
        await authStore.logout(false);
        return false;
      }
    }

    return true;
  });
}

export { createRouterGuard };
