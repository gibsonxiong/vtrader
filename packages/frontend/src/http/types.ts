import type { AxiosRequestConfig } from 'axios'

export interface CustomRequestConfig extends AxiosRequestConfig {
  /** 是否显示 loading，默认 true */
  showLoading?: boolean
  /** 是否显示错误 toast，默认 true */
  showError?: boolean
  /** loading 提示文字 */
  loadingText?: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}
