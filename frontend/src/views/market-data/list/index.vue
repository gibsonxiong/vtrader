<script lang="ts" setup>
import { Form, Button, Select, message } from 'ant-design-vue';
import { reactive, ref, onMounted } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import KlineChart from '#/components/KlineChart/index.vue';
import { getContractsApi, type MarketDataApi } from '#/api';
import { Interval } from '@vtrader/shared';

defineOptions({ name: 'MarketList' });

const state = reactive({
  brokerId: 'binance',
  symbol: 'BTCUSDT:USDT',
  interval: '1m' as string,
});
const contracts = ref<MarketDataApi.ContractData[]>([]);

onMounted(async () => {
  try {
    const res = await getContractsApi(state.brokerId);
    contracts.value = res.data || [];
  } catch { /* ignore */ }
});

const intervalOptions = [
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '15分钟', value: '15m' },
  { label: '1小时', value: '1h' },
  { label: '4小时', value: '4h' },
  { label: '日线', value: '1d' },
];
</script>

<template>
  <div class="mobile-page">
    <Form layout="inline" style="margin-bottom:8px;flex-wrap:nowrap;overflow-x:auto">
      <Form.Item style="flex:1;min-width:120px">
        <Select
          v-model:value="state.symbol"
          :options="contracts.map(c => ({ label: c.symbol, value: c.symbol }))"
          size="small"
          placeholder="交易对"
        />
      </Form.Item>
      <Form.Item style="width:80px">
        <Select v-model:value="state.interval" :options="intervalOptions" size="small" />
      </Form.Item>
    </Form>
    <KlineChart :broker-id="state.brokerId" :symbol="state.symbol" :interval="state.interval" />
  </div>
</template>

<style scoped>
.mobile-page { padding: 0; }
</style>
