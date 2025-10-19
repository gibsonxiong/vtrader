<script lang="ts" setup>
import { Page } from '@vtrader/common-ui';
import { Form, Input, Button, DatePicker, Select, Space, message, Table } from 'ant-design-vue';
import { reactive, ref } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import MarketDataChart from '#/components/MarketDataChart.vue';
import { getContractsApi, getBarsApi, downloadBarsApi, type MarketDataApi } from '#/api';
import { Interval, type BarData } from '@vtrader/shared';

const defaultState = {
  symbol: 'BTCUSDT:USDT', 
  interval: Interval.MINUTE_1,
  start: dayjs().subtract(4, 'day'),
  end: dayjs().add(1, 'day'),
}


const chartRef = ref<typeof MarketDataChart>();

const formState = reactive<{
  symbol: string;
  interval: Interval;
  start: Dayjs;
  end: Dayjs;
}>({
  ...defaultState,
});
const downloading = ref(false);

const intervalOptions = [
  { label: '1m', value: Interval.MINUTE_1 },
  { label: '5m', value: Interval.MINUTE_5 },
  { label: '15m', value: Interval.MINUTE_15 },
  { label: '1h', value: Interval.HOUR_1 },
  { label: '4h', value: Interval.HOUR_4 },
  { label: '1d', value: Interval.DAILY_1 },
];

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

async function downloadBars() {
  try {
    downloading.value = true;
    const params: MarketDataApi.DownloadParams = {
      symbol: formState.symbol,
      interval: formState.interval,
      start: formState.start?.format('YYYY-MM-DD') || '',
    };
    if (formState.end) params.end = formState.end.format('YYYY-MM-DD');

    const {data} = await downloadBarsApi(params);
    message.success(`下载完成，新增 ${data.count} 条记录`);
    chartRef.value?.fetchBars();
  } catch (err: any) {
    message.error('下载失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  } finally {
    downloading.value = false;
  }
}

// 处理图表组件的数据更新
function handleBarsUpdated(newBars: BarData[]) {
  bars.value = newBars;
}

// 处理符号变化
function handleSymbolChanged(symbol: string) {
  formState.symbol = symbol;
  console.log('Symbol changed to:', symbol);
}
</script>

<template>
  <Page title="行情数据">
    <div class="p-4">
      <Form :model="formState" layout="inline" autocomplete="off" @submit.prevent>
        <!-- <Form.Item label="Symbol" name="symbol" :rules="[{ required: true, message: '请输入标的!' }]">
          <Input v-model:value="formState.symbol" style="width: 200px" placeholder="如 BTCUSDT:USDT" />
        </Form.Item> -->

        <Form.Item label="Interval" name="interval" :rules="[{ required: true, message: '请选择周期!' }]">
          <Select v-model:value="formState.interval" :options="intervalOptions" style="width: 120px" />
        </Form.Item>

        <Form.Item label="开始日期" name="start" :rules="[{ required: true, message: '请选择开始日期!' }]">
          <DatePicker v-model:value="formState.start" style="width: 160px" />
        </Form.Item>

        <Form.Item label="结束日期" name="end">
          <DatePicker v-model:value="formState.end" style="width: 160px" />
        </Form.Item>

        <Form.Item>
          <Space>
            <!-- <Button type="primary" @click="fetchBars" :loading="loading">查询</Button> -->
            <Button @click="downloadBars" :loading="downloading">下载并入库</Button>
          </Space>
        </Form.Item>
      </Form>

      <MarketDataChart
        ref="chartRef"
        :symbol="formState.symbol"
        :interval="formState.interval"
        :start="formState.start"
        :end="formState.end"
        @symbol-changed="handleSymbolChanged"
        @bars-updated="handleBarsUpdated"
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
