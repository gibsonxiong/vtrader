import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { defineStore } from 'pinia';
import { notification } from 'ant-design-vue';
import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';
import { setAccessToken, getAccessToken } from '#/api/request';

export interface UserInfo {
  id: number;
  realName: string;
  roles: string[];
  username: string;
  homePath?: string;
}

const LOGIN_PATH = '/auth/login';
const DEFAULT_HOME_PATH = '/dashboard/analytics';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  const loginLoading = ref(false);
  const accessToken = ref<string | null>(getAccessToken());
  const accessCodes = ref<string[]>([]);
  const accessChecked = ref(false);
  const loginExpired = ref(false);

  async function authLogin(params: Record<string, any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: UserInfo | null = null;
    try {
      loginLoading.value = true;
      const { accessToken: token } = await loginApi(params);

      if (token) {
        setAccessToken(token);
        accessToken.value = token;

        const [fetchUserInfoResult, codes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;
        accessCodes.value = codes;

        if (loginExpired.value) {
          loginExpired.value = false;
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo?.homePath || DEFAULT_HOME_PATH);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    setAccessToken(null);
    accessToken.value = null;
    accessChecked.value = false;
    accessCodes.value = [];
    loginExpired.value = false;

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi() as UserInfo;
    return userInfo;
  }

  return {
    accessToken,
    accessChecked,
    accessCodes,
    loginExpired,
    loginLoading,
    authLogin,
    fetchUserInfo,
    logout,
  };
});

export { LOGIN_PATH, DEFAULT_HOME_PATH };
