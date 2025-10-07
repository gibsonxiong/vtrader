<script lang="ts" setup>
import { Page, Loading } from '@vtrader/common-ui';
import { Form, Input, Button, DatePicker, Select, InputNumber, Table, Space, message } from 'ant-design-vue';
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { init, dispose } from 'klinecharts';
import type { Chart } from 'klinecharts';

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

// 新增：合约数据类型（前端最小字段）
interface ContractData {
  name: string;
  symbol: string;
}

const formState = reactive<{
  symbol: string;
  interval: Interval;
  start: Dayjs | undefined;
  end: Dayjs | undefined;
}>({
  symbol: 'BTCUSDT:USDT',
  interval: '1m',
  start: dayjs(),
  end: dayjs().add(1, 'day'),
});

const intervalOptions = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

const loading = ref(false);
const downloading = ref(false);
const bars = ref<BarData[]>([]);

// 新增：合约列表与加载状态
const contracts = ref<ContractData[]>([]);
const contractsLoading = ref(false);

const chartDivRef = ref<HTMLDivElement | null>(null);
let klineChart: Chart | null = null;

// 新增：获取合约列表
async function fetchContracts() {
  try {
    contractsLoading.value = true;
    const { data } = await axios.get<ContractData[]>('http://127.0.0.1:3000/market-data/contracts');
    contracts.value = data || [];
  } catch (err: any) {
    message.error('获取合约失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
    contracts.value = [];
  } finally {
    contractsLoading.value = false;
  }
}

// 新增：选择合约后切换 symbol 并刷新K线
function selectSymbol(c: ContractData) {
  if (!c?.symbol) return;
  formState.symbol = c.symbol;
  fetchBars();
}

function mapBarsToKLineData(list: BarData[]) {
  return list.map((b) => ({
    timestamp: Number(b.timestamp),
    open: Number(b.open),
    high: Number(b.high),
    low: Number(b.low),
    close: Number(b.close),
    volume: Number(b.volume),
  }));
}

function intervalToPeriod(interval: Interval): { span: number; type: 'minute' | 'hour' | 'day' } {
  switch (interval) {
    case '1m':
      return { span: 1, type: 'minute' };
    case '5m':
      return { span: 5, type: 'minute' };
    case '15m':
      return { span: 15, type: 'minute' };
    case '1h':
      return { span: 1, type: 'hour' };
    case '4h':
      return { span: 4, type: 'hour' };
    case '1d':
    default:
      return { span: 1, type: 'day' };
  }
}

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

onMounted(() => {
  // 新增：初始化加载合约列表
  fetchContracts();
  if (chartDivRef.value) {
    klineChart = init(chartDivRef.value, {
      styles: 'custom'
    });

    if (!klineChart) return;

    // 在底部新增成交量指标面板（VOL），高度约 100px
    try {
      klineChart.createIndicator({
        name: 'VOL',
        calcParams: [],
        series: 'normal',
      }, false, { 
        height: 100,
      });
    } catch (e) {
      // 忽略可能的 v10 alpha 版本 API 差异导致的异常，不影响主图显示
      console.warn('Create VOL indicator failed:', e);
    }

    // 首次加载
    fetchBars();
  }
});

onBeforeUnmount(() => {
  if (klineChart) {
    dispose(klineChart);
    klineChart = null;
  }
});

async function fetchBars() {
  if (!klineChart) {
    message.error('图表未初始化');
    return;
  }
  try {
    loading.value = true;
    const period = intervalToPeriod(formState.interval);
    // 设置交易对与周期，v10 推荐通过 setDataLoader 提供数据
    klineChart.setSymbol({ ticker: formState.symbol });
    klineChart.setPeriod(period);

    klineChart.setDataLoader({
      getBars: async ({ callback }: any) => {
        try {
          const params: Record<string, any> = {
            symbol: formState.symbol,
            interval: formState.interval,
            start: formState.start?.format('YYYY-MM-DD'),
          };
          if (formState.end) params.end = formState.end.format('YYYY-MM-DD');
          
          const { data } = await axios.get<BarData[]>('http://127.0.0.1:3000/market-data/bars', { params });
          callback(mapBarsToKLineData(data));
          bars.value = data.reverse();
        } catch (err: any) {
          message.error('获取K线失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
          bars.value = [];
          callback([]);
        } finally {
          loading.value = false;
        }
      },
    });
  } catch (err: any) {
    loading.value = false;
    message.error('获取K线失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}

async function downloadBars() {
  try {
    downloading.value = true;
    const body: Record<string, any> = {
      symbol: formState.symbol,
      interval: formState.interval,
      start: formState.start?.format('YYYY-MM-DD'),
    };
    if (formState.end) body.end = formState.end.format('YYYY-MM-DD');

    const { data } = await axios.post<{ count: number }>('http://127.0.0.1:3000/market-data/download', body);
    message.success(`下载完成，新增 ${data.count} 条记录`);
    fetchBars();
  } catch (err: any) {
    message.error('下载失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  } finally {
    downloading.value = false;
  }
}

// function resetForm() {
//   formState.symbol = 'BTCUSDT:USDT';
//   formState.interval = '15m';
//   formState.start = dayjs().subtract(1, 'month');
//   formState.end = dayjs();
//   bars.value = [];
// }
</script>

<template>
  <Page title="行情数据">
    <div class="p-4">
      <Form :model="formState" layout="inline" autocomplete="off" @submit.prevent>
        <Form.Item label="Symbol" name="symbol" :rules="[{ required: true, message: '请输入标的!' }]">
          <Input v-model:value="formState.symbol" style="width: 200px" placeholder="如 BTCUSDT:USDT" />
        </Form.Item>

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
            <Button type="primary" @click="fetchBars" :loading="loading">查询</Button>
            <!-- <Button danger @click="resetForm">重置</Button> -->
            <Button @click="downloadBars" :loading="downloading">下载并入库</Button>
          </Space>
        </Form.Item>
      </Form>

      <div class="chart-container">
        <div class="symbol-list">
          <Loading :spinning="contractsLoading">
            <ul class="symbol-ul">
              <li
                v-for="c in contracts"
                :key="c.symbol"
                class="symbol-item"
                :title="c.symbol"
                @click="selectSymbol(c)"
              >
                {{ c.name }}
              </li>
            </ul>
          </Loading>
        </div>
        <div ref="chartDivRef" class="mt-4 kline-container"></div>
      </div>

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
.kline-container {
  flex: 1;
  height: 600px;
  border: 1px solid #999;
  border-radius: 4px;
}

/* 新增：布局与列表样式 */
.chart-container {
  display: flex;
  align-items: flex-start;
}
.symbol-list {
  width: 240px;
  height: 600px;
  border: 1px solid #999;
  border-radius: 4px;
  padding: 8px;
  overflow-y: auto;
  margin-right: 16px;
  margin-top: 16px;
}
.symbol-ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.symbol-item {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.symbol-item:hover {
  background: #f5f7fa;
}
</style>
