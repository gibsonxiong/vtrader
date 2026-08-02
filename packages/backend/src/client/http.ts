import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";
import type { HttpRequestConfig, Http } from '../types/client';

// 基础重试拦截器
export const retryInterceptor = async (error: AxiosError, config: HttpRequestConfig, instance: Http) => {
  const { retryCount = 3, retryDelay = 500 } = config;

  // 如果不是超时错误或已达到最大重试次数，则不重试
  if (
    retryCount <= 0
  ) {
    return Promise.reject(error);
  }

  // 设置重试计数器
  config.retryCount = retryCount - 1;

  // 固定延迟后重试（例如1秒）
  await new Promise(resolve => setTimeout(resolve, retryDelay));

  // 重新发起请求
  console.log(config.url, `超时重试中，剩余${config.retryCount}次...`);
  return instance.request(config);
}

export function createHttp (config: HttpRequestConfig): Http {
  const instance = axios.create({
    timeout: 5000,
    ...config,
  });

  const http = {
    async request(config: HttpRequestConfig): Promise<axios.AxiosResponse<any, any>> {
      let resp;
      try {
        resp = await instance.request(config);
      } catch(error) {
        try {
          resp = await retryInterceptor(error, config, http);
        } catch (error2) {
          throw new Error(error2);
        }
      }
      return resp;
    }
  }

  return http;
} 
