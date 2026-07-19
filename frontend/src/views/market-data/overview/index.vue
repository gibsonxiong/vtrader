<script lang="ts" setup>
import { Table, Tag, message, Form, Button, Modal, Select, DatePicker } from 'ant-design-vue';
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import dayjs, { Dayjs } from 'dayjs';
import { batchDownloadBarsApi, getContractsApi, type MarketDataApi } from '#/api';
import { Interval } from '@vtrader/shared';
import { tradeRequestClient } from '#/api/request';

defineOptions({ name: 'MarketOverview' });

interface BarOverviewItem { id: number; brokerName: string; symbol: string; interval: string; ranges: [string, string][]; }
type TableNode = BarOverviewItem & { key: string; children?: TableNode[] };

const loading = ref(false);
const list = ref<BarOverviewItem[]>([]);
const router = useRouter();

const columns = [
  { dataIndex: 'symbol', title: '交易对', width: 120, ellipsis: true },
  { dataIndex: 'interval', title: '周期', width: 55 },
  { dataIndex: 'ranges', title: '数据区间', ellipsis: true },
];

const downloadModal = ref(false);
const downloadForm = reactive({ brokerId: 'binance', symbol: '', interval: '', startDate: null as Dayjs | null, endDate: null as Dayjs | null });
const contracts = ref<MarketDataApi.ContractData[]>([]);
const barOverviews = ref<BarOverviewItem[]>([]);

const intervalOptions = Object.values(Interval).map(v => ({ label: v, value: v }));

async function fetchData() {
  loading.value = true;
  try {
    const res = await tradeRequestClient.post('/market-data/getBarOverviews');
    list.value = res.data?.data || [];
  } catch { list.value = []; }
  finally { loading.value = false; }
}

async function openDownload() {
  downloadModal.value = true;
  const res = await getContractsApi('binance');
  contracts.value = res.data || [];
}

async function handleDownload() {
  if (!downloadForm.symbol || !downloadForm.interval) { message.warn('请选择交易对和周期'); return; }
  try {
    await batchDownloadBarsApi({
      brokerId: downloadForm.brokerId,
      symbols: [downloadForm.symbol],
      interval: downloadForm.interval as any,
      startDate: downloadForm.startDate?.format('YYYY-MM-DD'),
      endDate: downloadForm.endDate?.format('YYYY-MM-DD'),
    });
    message.success('下载成功');
    downloadModal.value = false;
    fetchData();
  } catch { message.error('下载失败'); }
}

onMounted(fetchData);
</script>

<template>
  <div class="mobile-page">
    <div class="page-header">
      <h3>数据大纲</h3>
      <Button type="primary" size="small" @click="openDownload">下载数据</Button>
    </div>
    <Table
      :columns="columns" :data-source="list" :loading="loading"
      :pagination="false" size="small" :scroll="{ x: 360 }"
    >
      <template #bodyCell="{ column, text }">
        <template v-if="column.dataIndex === 'ranges'">
          <Tag v-for="r in text" :key="r[0]" color="blue" style="margin:2px">{{ r[0] }} ~ {{ r[1] }}</Tag>
        </template>
      </template>
    </Table>

    <Modal v-model:open="downloadModal" title="批量下载K线" :footer="null">
      <Form :model="downloadForm" layout="vertical" size="large">
        <Form.Item label="交易对">
          <Select v-model:value="downloadForm.symbol" :options="contracts.map(c => ({ label: c.symbol, value: c.symbol }))" placeholder="选择交易对" />
        </Form.Item>
        <Form.Item label="周期">
          <Select v-model:value="downloadForm.interval" :options="intervalOptions" placeholder="选择周期" />
        </Form.Item>
        <Form.Item label="开始日期">
          <DatePicker v-model:value="downloadForm.startDate" style="width:100%" />
        </Form.Item>
        <Form.Item label="结束日期">
          <DatePicker v-model:value="downloadForm.endDate" style="width:100%" />
        </Form.Item>
        <Button type="primary" block @click="handleDownload">开始下载</Button>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.mobile-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.page-header h3 { font-size: 16px; margin: 0; }
</style>
