<script lang="ts" setup>
import { Page } from '@vtrader/common-ui';
import { Table, Tag, message, Form, DatePicker, Select, Space, Button, Modal, SelectOptGroup, SelectOption } from 'ant-design-vue';
import { ref, onMounted, h, reactive, computed, watch } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { batchDownloadBarsApi, getContractsApi, type MarketDataApi } from '#/api';
import { Interval } from '@vtrader/shared';
import { tradeRequestClient } from '#/api/request';
import { globalTableConfig } from '#/config/table';

interface BarOverviewItem {
  id: number;
  brokerName: string;
  symbol: string;
  interval: string;
  ranges: [string, string][];
}

type TableNode = {
  id: string | number;
  brokerName?: string;
  symbol?: string;
  interval?: string;
  ranges?: [string, string][];
  children?: TableNode[];
};

const loading = ref(false);
const overviews = ref<BarOverviewItem[]>([]);
const treeData = computed<TableNode[]>(() => {
  const brokerMap = new Map<string, Map<string, BarOverviewItem[]>>();
  overviews.value.forEach((o) => {
    if (!brokerMap.has(o.brokerName)) brokerMap.set(o.brokerName, new Map());
    const symMap = brokerMap.get(o.brokerName)!;
    if (!symMap.has(o.symbol)) symMap.set(o.symbol, []);
    symMap.get(o.symbol)!.push(o);
  });

  const brokers: TableNode[] = [];
  brokerMap.forEach((symMap, bname) => {
    const symbols: TableNode[] = [];
    symMap.forEach((items, sym) => {
      const intervals: TableNode[] = items.map((it) => ({
        id: it.id,
        interval: it.interval,
        ranges: it.ranges,
      }));
      symbols.push({
        id: `symbol-${bname}-${sym}`,
        symbol: sym,
        children: intervals,
      });
    });
    brokers.push({
      id: `broker-${bname}`,
      brokerName: bname,
      children: symbols,
    });
  });
  return brokers;
});

const expandedKeys = ref<(string | number)[]>([]);
watch(treeData, (nodes) => {
  const keys: (string | number)[] = [];
  nodes.forEach((broker) => {
    keys.push(broker.id);
    (broker.children || []).forEach((sym) => keys.push(sym.id));
  });
  expandedKeys.value = keys;
}, { immediate: true });

function handleExpandedRowsChange(keys: (string | number)[]) {
  expandedKeys.value = keys;
}

const batchModalOpen = ref(false);
const downloading = ref(false);
const brokerGroups = ref<{ label: string; options: { label: string; value: string }[] }[]>([]);
const brokerId2Name = ref<Record<string, string>>({});
const contracts = ref<MarketDataApi.ContractData[]>([]);

const defaultDateRange = {
  startDate: dayjs().subtract(4, 'day'),
  endDate: dayjs(),
};

const formState = reactive<{
  brokerId: string;
  symbols: string[];
  intervals: string[];
  startDate: Dayjs;
  endDate: Dayjs | null;
}>({
  brokerId: '',
  symbols: [],
  intervals: [
    Interval.MINUTE_1,
    Interval.MINUTE_5,
  ],
  startDate: defaultDateRange.startDate,
  endDate: defaultDateRange.endDate,
});

const intervalOptions = [
  { label: '1m', value: Interval.MINUTE_1 },
  { label: '5m', value: Interval.MINUTE_5 },
  { label: '15m', value: Interval.MINUTE_15 },
  { label: '1h', value: Interval.HOUR_1 },
  { label: '4h', value: Interval.HOUR_4 },
  { label: '1d', value: Interval.DAILY_1 },
];

const symbolOptions = computed(() => {
  return contracts.value.map((c) => ({ label: c.symbol, value: c.symbol }));
});

const columns = [
  { title: 'Broker', dataIndex: 'brokerName', key: 'brokerName', width: 220 },
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol', width: 160 },
  { title: 'Interval', dataIndex: 'interval', key: 'interval', width: 100 },
  {
    title: 'Ranges',
    dataIndex: 'ranges',
    key: 'ranges',
    width: 480,
    customRender: ({ text }: any) => {
      const arr = Array.isArray(text) ? text : [];
      return h(
        'div',
        { style: 'display:flex; flex-wrap:wrap; gap:6px;' },
        arr.map((r: [string, string]) => h(Tag, null, { default: () => `${r[0]} ~ ${r[1]}` }))
      );
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    customRender: ({ record }: any) => {
      if (!record.interval) return null;
      const onClick = () => openDeleteModal(record.id as number);
      return h(
        Button,
        { type: 'primary', danger: true, size: 'small', onClick },
        { default: () => '删除' },
      );
    },
  },
];

async function fetchBarOverviews() {
  try {
    loading.value = true;
    const { data } = await tradeRequestClient.post('/market-data/getBarOverviews');
    overviews.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    message.error('获取概览失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

async function fetchBrokerConfigs() {
  try {
    const { data } = await tradeRequestClient.post('/broker-manager/getConfigs');
    const groupsMap: Record<string, { label: string; options: { label: string; value: string }[] }> = {};
    const id2name: Record<string, string> = {};
    (data || []).forEach((c: any) => {
      const key = c.brokerName;
      if (!groupsMap[key]) {
        groupsMap[key] = { label: key, options: [] };
      }
      groupsMap[key].options.push({ label: c.id, value: c.id });
      id2name[c.id] = c.brokerName;
    });
    brokerGroups.value = Object.values(groupsMap);
    brokerId2Name.value = id2name;
    if (!formState.brokerId && brokerGroups.value.length) {
      const first = brokerGroups.value[0]?.options?.[0];
      if (first) formState.brokerId = first.value;
    }
  } catch (err: any) {
    message.error('获取Broker配置失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}

async function fetchContracts() {
  if (!formState.brokerId) {
    contracts.value = [];
    return;
  }
  try {
    const { data } = await getContractsApi(formState.brokerId);
    contracts.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    message.error('获取合约失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}

function openBatchModal() {
  batchModalOpen.value = true;
}

async function submitBatchDownload() {
  try {
    downloading.value = true;
    const params: MarketDataApi.BatchDownloadParams = {
      brokerId: formState.brokerId,
      symbols: formState.symbols,
      intervals: formState.intervals,
      startDate: formState.startDate?.format('YYYY-MM-DD') || '',
    };
    if (formState.endDate) params.endDate = formState.endDate.format('YYYY-MM-DD');
    const { data } = await batchDownloadBarsApi(params);
    message.success(`批量下载完成，新增 ${data.count} 条记录`);
    batchModalOpen.value = false;
    fetchBarOverviews();
  } catch (err: any) {
    message.error('批量下载失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  } finally {
    downloading.value = false;
  }
}

async function deleteOverview(id: number) {
  try {
    const { deleteBarOverviewApi } = await import('#/api/trading/market-data');
    await deleteBarOverviewApi({ id });
    message.success('删除成功');
    fetchBarOverviews();
  } catch (err: any) {
    message.error('删除失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}

const deleteModalOpen = ref(false);
const deleteTargetId = ref<number | null>(null);
function openDeleteModal(id: number) {
  deleteTargetId.value = id;
  deleteModalOpen.value = true;
}
async function confirmDelete() {
  if (deleteTargetId.value == null) return;
  await deleteOverview(deleteTargetId.value);
  deleteModalOpen.value = false;
  deleteTargetId.value = null;
}
function cancelDelete() {
  deleteModalOpen.value = false;
  deleteTargetId.value = null;
}

onMounted(() => {
  fetchBarOverviews();
  fetchBrokerConfigs();
  fetchContracts();
});

watch(() => formState.brokerId, () => {
  fetchContracts();
  formState.symbols = [];
});
</script>

<template>
  <Page>
    <div>
      <div class="mb-4">
        <Space>
          <Button type="primary" @click="openBatchModal">批量下载</Button>
        </Space>
      </div>
      <Table
        :dataSource="treeData"
        :columns="columns"
        rowKey="id"
        size="small"
        :loading="loading"
        :expandedRowKeys="expandedKeys"
        @expandedRowsChange="handleExpandedRowsChange"
        :pagination="{
          pageSize: globalTableConfig.pagination.defaultPageSize,
          showSizeChanger: true,
          pageSizeOptions: globalTableConfig.pagination.pageSizes.map(String),
        }"
        bordered
      />
      <Modal
        v-model:open="batchModalOpen"
        title="批量下载"
        :confirmLoading="downloading"
        @ok="submitBatchDownload"
      >
        <Form :model="formState" layout="vertical" autocomplete="off">
          <Form.Item label="Broker" name="brokerId" :rules="[{ required: true, message: '请选择Broker!' }]">
            <Select v-model:value="formState.brokerId" style="width: 260px">
              <SelectOptGroup v-for="group in brokerGroups" :key="group.label" :label="group.label">
                <SelectOption v-for="opt in group.options" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectOption>
              </SelectOptGroup>
            </Select>
          </Form.Item>
          <Form.Item label="Symbols" name="symbols" :rules="[{ required: true, message: '请选择或输入Symbols!' }]">
            <Select v-model:value="formState.symbols" :options="symbolOptions" mode="multiple" style="width: 100%" allow-clear />
          </Form.Item>
          <Form.Item label="Intervals" name="intervals" :rules="[{ required: true, message: '请选择Intervals!' }]">
            <Select v-model:value="formState.intervals" :options="intervalOptions" mode="multiple" style="width: 100%" />
          </Form.Item>
          <Space>
            <Form.Item label="开始日期" name="startDate" :rules="[{ required: true, message: '请选择开始日期!' }]">
              <DatePicker v-model:value="formState.startDate" style="width: 160px" />
            </Form.Item>
            <Form.Item label="结束日期" name="endDate">
              <DatePicker v-model:value="formState.endDate" style="width: 160px" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
      <Modal
        v-model:open="deleteModalOpen"
        title="删除确认"
        okText="删除"
        :okButtonProps="{ danger: true }"
        @ok="confirmDelete"
        @cancel="cancelDelete"
      >
        <div>确认删除该概览记录？该操作不可恢复。</div>
      </Modal>
    </div>
  </Page>
  
</template>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
</style>
