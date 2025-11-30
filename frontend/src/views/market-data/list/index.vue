<script lang="ts" setup>
import { Page } from '@vtrader/common-ui';
import { Form, Input, Button, DatePicker, Select, Space, message, Table, SelectOptGroup, SelectOption } from 'ant-design-vue';
import { reactive, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs, { Dayjs } from 'dayjs';
import KlineChart from '#/components/KlineChart/index.vue';
import { getContractsApi, getBarsApi, downloadBarsApi, type MarketDataApi } from '#/api';
import { tradeRequestClient } from '#/api/request';
import { Interval, type BarData } from '@vtrader/shared';
import { globalTableConfig } from '#/config/table';

const defaultState = {
  brokerId: 'binance_test',
  symbol: 'BTCUSDT:USDT', 
  interval: Interval.MINUTE_15,
  startDate: dayjs().subtract(4, 'day'),
  endDate: dayjs(),
}


const chartRef = ref<typeof KlineChart>();
const route = useRoute();

const formState = reactive<{
  brokerId: string;
  symbol: string;
  interval: Interval;
  startDate: Dayjs;
  endDate: Dayjs;
}>({

  ...defaultState,
});
const inited = ref(false);
const downloading = ref(false);
const brokerGroups = ref<{ label: string; options: { label: string; value: string }[] }[]>([]);

const intervalOptions = [
  { label: '1m', value: Interval.MINUTE_1 },
  { label: '5m', value: Interval.MINUTE_5 },
  { label: '15m', value: Interval.MINUTE_15 },
  { label: '1h', value: Interval.HOUR_1 },
  { label: '4h', value: Interval.HOUR_4 },
  { label: '1d', value: Interval.DAILY_1 },
];

// async function downloadBars() {
//   try {
//     downloading.value = true;
//     const params: MarketDataApi.DownloadParams = {
//       brokerId: formState.brokerId,
//       symbol: formState.symbol,
//       interval: formState.interval,
//       startDate: formState.startDate?.format('YYYY-MM-DD') || '',
//     };
//     if (formState.endDate) params.endDate = formState.endDate.format('YYYY-MM-DD');

//     const {data} = await downloadBarsApi(params);
//     message.success(`下载完成，新增 ${data.count} 条记录`);
//     chartRef.value?.fetchBars();
//   } catch (err: any) {
//     message.error('下载失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
//   } finally {
//     downloading.value = false;
//   }
// }

async function fetchBrokerConfigs() {
  try {
    const { data } = await tradeRequestClient.post('/broker-manager/getConfigs');
    const groupsMap: Record<string, { label: string; options: { label: string; value: string }[] }> = {};
    (data || []).forEach((c: any) => {
      const key = c.brokerName;
      if (!groupsMap[key]) {
        groupsMap[key] = { label: key, options: [] };
      }
      groupsMap[key].options.push({ label: c.id, value: c.id });
    });
    brokerGroups.value = Object.values(groupsMap);

    if (!formState.brokerId && brokerGroups.value.length) {
      const first = brokerGroups.value[0]?.options?.[0];
      if (first) formState.brokerId = first.value;
    }
  } catch (err: any) {
    message.error('获取Broker配置失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}

function applyQueryParams(): void {
  const q = route.query as Record<string, any>;
  if (q.symbol) formState.symbol = String(q.symbol);
  if (q.interval) formState.interval = q.interval as Interval;
  if (q.startDate) formState.startDate = dayjs(String(q.startDate));
  if (q.endDate) formState.endDate = dayjs(String(q.endDate));
  if (q.brokerId) {
    formState.brokerId = String(q.brokerId);
  } else if (q.brokerName) {
    const group = brokerGroups.value.find(g => g.label === String(q.brokerName));
    const first = group?.options?.[0];
    if (first) formState.brokerId = first.value;
  }
}

// // 处理图表组件的数据更新
// function handleBarsUpdated(newBars: BarData[]) {
//   bars.value = newBars;
// }

// // 处理符号变化
// function handleSymbolChanged(symbol: string) {
//   formState.symbol = symbol;
//   console.log('Symbol changed to:', symbol);
// }

onMounted(async () => {
  await fetchBrokerConfigs();
  applyQueryParams();
  inited.value = true;
});

watch(() => route.query, () => {
  applyQueryParams();
});
</script>

<template>
  <Page>
    <div>
      <!-- <Form :model="formState" layout="inline" autocomplete="off" @submit.prevent class="mb-4">
        <Form.Item label="Broker" name="brokerId" :rules="[{ required: true, message: '请选择Broker!' }]">
          <Select v-model:value="formState.brokerId" style="width: 220px">
            <SelectOptGroup v-for="group in brokerGroups" :key="group.label" :label="group.label">
              <SelectOption v-for="opt in group.options" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectOption>
            </SelectOptGroup>
          </Select>
        </Form.Item>

        <Form.Item label="Symbol" name="symbol" :rules="[{ required: true, message: '请输入标的!' }]">
          <Input v-model:value="formState.symbol" style="width: 200px" placeholder="如 BTCUSDT:USDT" />
        </Form.Item>

        <Form.Item label="Interval" name="interval" :rules="[{ required: true, message: '请选择周期!' }]">
          <Select v-model:value="formState.interval" :options="intervalOptions" style="width: 120px" />
        </Form.Item>

        <Form.Item label="开始日期" name="startDate" :rules="[{ required: true, message: '请选择开始日期!' }]">
          <DatePicker v-model:value="formState.startDate" style="width: 160px" />
        </Form.Item>

        <Form.Item label="结束日期" name="endDate">
          <DatePicker v-model:value="formState.endDate" style="width: 160px" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button @click="downloadBars" :loading="downloading">下载并入库</Button>
          </Space>
        </Form.Item>
      </Form> -->

      <KlineChart
        ref="chartRef"
        v-if="inited"
        :broker-id="formState.brokerId"
        v-model:symbol="formState.symbol"
        v-model:interval="formState.interval"
        v-model:startDate="formState.startDate"
        v-model:endDate="formState.endDate"
      />

      <!-- <Table
        class="mt-4"
        :dataSource="bars"
        :columns="columns"
        rowKey="timestamp"
        size="small"
        :loading="loading"
        :pagination="{
          pageSize: globalTableConfig.pagination.defaultPageSize,
          showSizeChanger: true,
          pageSizeOptions: globalTableConfig.pagination.pageSizes.map(String),
        }"
        bordered
      /> -->
    </div>
  </Page>
</template>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
</style>
