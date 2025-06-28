import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:history-outlined',
      order: 10,
      title: $t('回测'),
    },
    name: 'Backtest',
    path: '/backtest',
    children: [
      {
        name: 'StartBacktest',
        path: 'start',
        component: () => import('#/views/backtest/start/index.vue'),
        meta: {
          title: $t('开始回测'),
        },
      },
      {
        name: 'BacktestHistory',
        path: 'history',
        component: () => import('#/views/backtest/history/index.vue'),
        meta: {
          title: $t('回测历史'),
        },
      },
      {
        name: 'BacktestResult',
        path: 'result',
        component: () => import('#/views/backtest/result/index.vue'),
        meta: {
          title: $t('回测结果'),
        },
      },
    ],
  },
];

export default routes;
