import Toast from 'antd-mobile-vue-next/es/toast'
import 'antd-mobile-vue-next/es/toast/style'

type ToastHandle = {
  hide?: () => void
} | null

let loadingToastHandle: ToastHandle = null

export function showToast(message: string) {
  return Toast.info(message, 2)
}

export function showLoadingToast(options: {
  message?: string
  duration?: number
  forbidClick?: boolean
}) {
  closeToast()

  const duration = options.duration === 0
    ? 24 * 60 * 60
    : Math.max(Math.round((options.duration ?? 2000) / 1000), 1)

  loadingToastHandle = Toast.loading(
    options.message ?? '加载中...',
    duration,
    undefined,
    options.forbidClick ?? false,
  )

  return loadingToastHandle
}

export function closeToast() {
  loadingToastHandle?.hide?.()
  loadingToastHandle = null
}
