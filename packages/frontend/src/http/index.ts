import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { showLoadingToast, closeToast, showToast } from '@/ui/mobile'
import type { CustomRequestConfig, ApiResponse } from './types'

let loadingCount = 0
let loadingInstance: ReturnType<typeof showLoadingToast> | null = null

function showLoading(text = '加载中...') {
  loadingCount++
  if (loadingCount === 1) {
    loadingInstance = showLoadingToast({
      message: text,
      duration: 0,
      forbidClick: true,
    })
  }
}

function hideLoading() {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    if (loadingInstance) {
      closeToast()
      loadingInstance = null
    }
  }
}

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig & CustomRequestConfig) => {
    if (config.showLoading !== false) {
      showLoading(config.loadingText)
    }

    // 可在此处添加 token
    // const token = useUserStore().token
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error) => {
    hideLoading()
    return Promise.reject(error)
  },
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    hideLoading()

    const config = response.config as CustomRequestConfig
    const res = response.data

    // 如果后端返回的业务 code 不是 0，视为业务错误
    if (res.code !== 0 && res.code !== 200) {
      if (config.showError !== false) {
        showToast(res.msg || '请求失败')
      }
      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return response
  },
  (error) => {
    hideLoading()

    const config = error.config as CustomRequestConfig | undefined

    if (config?.showError !== false) {
      const status = error.response?.status
      const messages: Record<number, string> = {
        400: '请求参数错误',
        401: '未授权，请重新登录',
        403: '拒绝访问',
        404: '请求地址不存在',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用',
      }
      showToast(messages[status] || error.message || '网络错误')
    }

    return Promise.reject(error)
  },
)

/**
 * GET 请求
 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: CustomRequestConfig,
): Promise<ApiResponse<T>> {
  return http.get(url, { params, ...config }).then((res) => res.data)
}

/**
 * POST 请求
 */
export function post<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  config?: CustomRequestConfig,
): Promise<ApiResponse<T>> {
  return http.post(url, data, config).then((res) => res.data)
}

/**
 * PUT 请求
 */
export function put<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  config?: CustomRequestConfig,
): Promise<ApiResponse<T>> {
  return http.put(url, data, config).then((res) => res.data)
}

/**
 * DELETE 请求
 */
export function del<T = unknown>(
  url: string,
  config?: CustomRequestConfig,
): Promise<ApiResponse<T>> {
  return http.delete(url, config).then((res) => res.data)
}

export default http
