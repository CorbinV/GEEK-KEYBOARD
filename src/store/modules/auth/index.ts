import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { clearAuthStorage, getToken, getUserInfo } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive(getUserInfo());
  const skipLogin: boolean = import.meta.env?.VITE_SKIP_LOGIN === 'Y';
  const useMock: boolean = import.meta.env?.VITE_USE_MOCK === 'Y';
  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    routeStore.resetStore();
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  let login = async (...args: any[]): Promise<void> => {
    if (useMock) {
      login = unauthLogin;
    } else {
      login = authLogin;
    }
    return login(...args);
  };
  async function authLogin(userName: string, password: string, redirect = true) {
    startLoading();
    let loginToken: any;
    let error: any;
    if (skipLogin) {
      loginToken = {
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IkFkbWluIn1dLCJpYXQiOjE2OTg0ODQ5NzIsImV4cCI6MTczMDA0NDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJBZG1pbiJ9.rLqWqgErEAgX4EVy_Kl_Eb1_bDmXyiZ9bZaupVgyv5M',
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbeyJ1c2VyTmFtZSI6IkFkbWluIn1dLCJpYXQiOjE2OTg0ODQ5NzIsImV4cCI6MTczMDA0NDc5OSwiYXVkIjoic295YmVhbi1hZG1pbiIsImlzcyI6IlNveWJlYW4iLCJzdWIiOiJBZG1pbiJ9.rLqWqgErEAgX4EVy_Kl_Eb1_bDmXyiZ9bZaupVgyv5M'
      };
    } else {
      const { data: xtoken, error: err } = await fetchLogin(userName, password);
      loginToken = xtoken;
      error = err;
    }

    if (!error) {
      const pass = await loginByToken(loginToken);

      if (pass) {
        await routeStore.initAuthRoute();

        if (redirect) {
          await redirectFromLogin();
        }

        if (routeStore.isInitAuthRoute) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
            duration: 4500
          });
        }
      }
    } else {
      resetStore();
    }

    endLoading();
  }
  async function unauthLogin() {
    const redirect = true;
    const { loginRes } = await import('@/service/data/fetchdata');
    const { data: loginToken } = loginRes;
    await loginByToken(loginToken);

    await routeStore.initAuthRoute();

    if (redirect) {
      await redirectFromLogin();
    } else {
      resetStore();
    }
  }
  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    let doFetch = async (): Promise<any> => {
      if (useMock) {
        doFetch = async (): Promise<typeof userInfoRes> => {
          const { userInfoRes } = await import('@/service/data/fetchdata');
          return userInfoRes;
        };
      } else {
        doFetch = async (): Promise<any> => {
          if (skipLogin) {
            return {
              data: {
                buttons: ['B_CODE2', 'B_CODE3'],
                roles: ['R_ADMIN'],
                userId: '2',
                userName: 'Admin'
              },
              error: null
            };
          }
          return await fetchGetUserInfo();
        };
      }
      return doFetch();
    };
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);

    const { data: info, error } = await doFetch();

    if (!error) {
      // 2. store user info
      localStg.set('userInfo', info);

      // 3. update store
      token.value = loginToken.token;
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    skipLogin,
    useMock
  };
});
