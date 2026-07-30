declare module 'antd-mobile-vue-next/es/toast' {
  const Toast: {
    info(content: string, duration?: number, onClose?: () => void, mask?: boolean): { hide?: () => void }
    success(content: string, duration?: number, onClose?: () => void, mask?: boolean): { hide?: () => void }
    fail(content: string, duration?: number, onClose?: () => void, mask?: boolean): { hide?: () => void }
    loading(content: string, duration?: number, onClose?: () => void, mask?: boolean): { hide?: () => void }
  }

  export default Toast
}

declare module 'antd-mobile-vue-next/es/toast/style'
