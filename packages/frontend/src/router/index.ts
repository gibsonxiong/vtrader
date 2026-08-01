import { createRouter, createWebHistory } from 'vue-router'
import MobileLayout from '@/components/MobileLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MobileLayout,
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/home/index.vue'),
        },
        {
          path: 'backtest',
          name: 'backtest',
          component: () => import('@/views/backtest/index.vue'),
        },
        {
          path: 'data',
          name: 'data',
          component: () => import('@/views/marketData/index.vue'),
        },
      ],
    },
    {
      path: '/broker',
      name: 'broker',
      component: () => import('@/views/broker/index.vue'),
    },
    {
      path: '/backtest/detail/:id',
      name: 'backtest-detail',
      component: () => import('@/views/backtestDetail/index.vue'),
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: () => import('@/views/contracts/index.vue'),
    },
  ],
})

export default router
