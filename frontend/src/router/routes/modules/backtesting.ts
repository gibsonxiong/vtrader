import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:history-outlined',
      order: 10,
      title: $t('回测'),
    },
    name: 'Backtesting',
    path: '/backtesting',
    children: [
      {
        name: 'StartBacktest',
        path: 'start',
        component: () => import('#/views/backtesting/start/index.vue'),
        meta: {
          title: $t('开始回测'),
        },
      },
      {
        name: 'BacktestHistory',
        path: 'history',
        component: () => import('#/views/backtesting/history/index.vue'),
        meta: {
          title: $t('回测历史'),
        },
      },
      {
        name: 'BacktestResult',
        path: 'result',
        component: () => import('#/views/backtesting/result/index.vue'),
        meta: {
          title: $t('回测结果'),
        },
      },
    ],
  },
];

export default routes;
