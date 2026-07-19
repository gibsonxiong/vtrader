import type { AxiosResponseHeaders } from 'axios';
import axios from 'axios';
import { message } from 'ant-design-vue';
import JSONBigInt from 'json-bigint';
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const apiURL = import.meta.env.VITE_GLOB_API_URL || '/api';

interface RequestClientOptions {
  responseReturn?: 'data' | 'raw';
}

class RequestClient {
  private axiosInstance = axios.create({
    baseURL: apiURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
    transformResponse: [
      (data: any, header?: AxiosResponseHeaders) => {
        if (header?.getContentType?.()?.toString().includes('application/json')) {
          return cloneDeep(JSONBigInt({ storeAsString: true, strict: true }).parse(data));
        }
        return data;
      },
    ],
  });

  constructor(public options: RequestClientOptions = {}) {}

  get<T = any>(url: string, config?: any): Promise<T> {
    return this.request({ ...config, method: 'GET', url });
  }

  post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request({ ...config, method: 'POST', url, data });
  }

  put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  delete<T = any>(url: string, config?: any): Promise<T> {
    return this.request({ ...config, method: 'DELETE', url });
  }

  async request<T = any>(config: any): Promise<T> {
    const response = await this.axiosInstance.request(config);
    if (this.options.responseReturn === 'data') {
      const body = response.data;
      if (body?.code === 0) return body.data as T;
      throw response;
    }
    return response as any;
  }
}

const ACCESS_TOKEN_KEY = 'vtrader_access_token';

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

// --- requestClient (with auth interceptors) ---

export const requestClient = new RequestClient({ responseReturn: 'data' });

requestClient['axiosInstance'].interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

async function doRefreshToken(): Promise<string> {
  const resp = await baseRequestClient.post('/auth/refresh');
  const newToken = resp.data;
  setAccessToken(newToken);
  return newToken;
}

requestClient['axiosInstance'].interceptors.response.use(
  (value) => value,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return requestClient['axiosInstance'](originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await doRefreshToken();
        refreshQueue.forEach((q) => q.resolve(newToken));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return requestClient['axiosInstance'](originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach((q) => q.reject(refreshError));
        refreshQueue = [];
        setAccessToken(null);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const responseData = error?.response?.data ?? {};
    const errorMessage = responseData?.error ?? responseData?.message ?? '';
    message.error(errorMessage || error.message);
    return Promise.reject(error);
  },
);

// --- baseRequestClient (no interceptors, for refresh/logout) ---

export const baseRequestClient = new RequestClient();

// --- tradeRequestClient ---

export const tradeRequestClient = axios.create({
  baseURL: apiURL,
  responseType: 'json',
});

tradeRequestClient.interceptors.response.use(
  (value) => value,
  (error) => {
    message.error(error.message);
    return Promise.reject(error);
  },
);

export { getAccessToken, setAccessToken, apiURL };
