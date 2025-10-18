<script lang="ts" setup>
import { Page } from '@vtrader/common-ui';
import { Table } from 'ant-design-vue';
import { ref } from 'vue';
import dayjs from 'dayjs';
import MarketDataChart from '#/components/MarketDataChart.vue';

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

interface BarData {
  symbol: string;
  timestamp: number;
  interval: Interval;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest?: number;
}

const bars = ref<BarData[]>([]);
const loading = ref(false);

const columns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    customRender: ({ text }: any) => dayjs(Number(text)).format('YYYY-MM-DD HH:mm'),
    width: 160,
  },
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol', width: 140 },
  { title: 'Interval', dataIndex: 'interval', key: 'interval', width: 80 },
  { title: 'Open', dataIndex: 'open', key: 'open', width: 100 },
  { title: 'High', dataIndex: 'high', key: 'high', width: 100 },
  { title: 'Low', dataIndex: 'low', key: 'low', width: 100 },
  { title: 'Close', dataIndex: 'close', key: 'close', width: 100 },
  { title: 'Volume', dataIndex: 'volume', key: 'volume', width: 120 },
  // { title: 'OI', dataIndex: 'openInterest', key: 'openInterest', width: 120 },
];

// 处理图表组件的数据更新
function handleBarsUpdated(newBars: BarData[]) {
  bars.value = newBars;
}

// 处理符号变化
function handleSymbolChanged(symbol: string) {
  console.log('Symbol changed to:', symbol);
}
</script>

<template>
  <Page title="行情数据">
    <div class="p-4">
      <MarketDataChart 
        @bars-updated="handleBarsUpdated"
        @symbol-changed="handleSymbolChanged"
      />

      <Table
        class="mt-4"
        :dataSource="bars"
        :columns="columns"
        rowKey="timestamp"
        size="small"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        bordered
      />
    </div>
  </Page>
</template>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
</style>
