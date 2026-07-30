import { configure } from '@vtrader/backend/api'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AntdMobile from 'antd-mobile-vue-next'

import './styles/global.css'

import App from './App.vue'
import router from './router'
import { vNumberColor } from './directives/numberColor'
import { post as fePost, get as feGet } from './http'

// 初始化 API Client
configure({
  post: <T>(url: string, data?: unknown) => fePost<T>(url, data as Record<string, unknown>) as Promise<T>,
  get: <T>(url: string, params?: unknown) => feGet<T>(url, params as Record<string, unknown>) as Promise<T>,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(AntdMobile)
app.directive('number-color', vNumberColor)

app.mount('#app')
