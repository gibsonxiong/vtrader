import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:history-outlined',
      order: 10,
      title: $t('行情数据'),
    },
    name: 'MarketData',
    path: '/market-data',
    children: [
      {
        name: 'List',
        path: 'list',
        component: () => import('#/views/market-data/list/index.vue'),
        meta: {
          title: $t('列表'),
        },
      },
    ],
  },
];

export default routes;
