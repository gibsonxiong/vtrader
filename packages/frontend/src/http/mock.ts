import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

type MockHandler = (config: {
  data?: unknown
  params?: Record<string, unknown>
}) => unknown

const mockRegistry = new Map<string, MockHandler>()

function getKey(method = 'GET', url = '') {
  return `${method.toUpperCase()}:${url}`
}

/**
 * 注册一个 mock 处理器
 */
export function defineMock(method: string, url: string, handler: MockHandler) {
  mockRegistry.set(getKey(method, url), handler)
}

/**
 * 在 axios 实例上启用 mock（仅在 dev 模式下生效）
 */
export function setupMock(http: AxiosInstance) {
  if (!import.meta.env.DEV) return

  const originalAdapter = http.defaults.adapter

  http.defaults.adapter = (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const key = getKey(config.method, config.url)
    const handler = mockRegistry.get(key)

    if (handler) {
      let requestData = config.data
      const requestParams = config.params as Record<string, unknown> | undefined
      const responseData = handler({
        data: requestData,
        params: requestParams,
      })

      // 打印 mock 请求关键信息
      const summary = typeof responseData === 'object' && responseData !== null
        ? (responseData as Record<string, unknown>).code === 0
          ? '✅ 成功'
          : `❌ 失败: ${(responseData as Record<string, unknown>).message ?? '未知'}`
        : '✅ 成功'
      console.log(
        `%c[Mock] %c${config.method?.toUpperCase()} %c${config.url}`,
        'color:#8b5cf6;font-weight:bold',
        'color:#22c55e;font-weight:bold',
        'color:#3b82f6;font-weight:bold',
        `\n  ${summary}`,
      )
      if (requestData) {
        try {
            requestData = JSON.parse(requestData)
        } catch (error) {
            
        }
        console.log('  请求体:', requestData)
      }
      if (requestParams) console.log('  查询参数:', requestParams)
      console.log('  响应:', responseData)

      // 模拟网络延迟
      const delay = 300 + Math.random() * 200

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          })
        }, delay)
      })
    }

    // 没有匹配的 mock，走真实请求
    if (typeof originalAdapter === 'function') {
      return originalAdapter(config)
    }
    return (axios.defaults.adapter as (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>)(config)
  }
}
