<script lang="ts" setup>
import type { Interval, TradeData } from '@vtrader/shared';
import KlineChart from '#/components/KlineChart/index.vue';
import TradingTable from './TradingTable.vue';
import type { Dayjs } from 'dayjs';
import { ref, watch } from 'vue';

interface TradingAnalysisProps {
  brokerId: string;
  symbol: string;
  interval: Interval;
  start: Dayjs;
  end: Dayjs;
  trades?: TradeData[];
}

const props = defineProps<TradingAnalysisProps>();

const klineRef = ref<InstanceType<typeof KlineChart> | null>(null);

function handleTableLocate(trade: TradeData) {
  const ts = new Date(trade.time).getTime();
  klineRef.value?.scrollToTimestamp?.(ts);
}

</script>

<template>
  <div class="trading-analysis">
    <!-- K线图表组件 -->
    <KlineChart
      ref="klineRef"
      :brokerId="props.brokerId"
      :symbol="props.symbol" 
      :interval="props.interval" 
      :startDate="props.start" 
      :endDate="props.end"
      :trades="props.trades || []"
    />
    <!-- 交易明细表格组件 -->
    <TradingTable class="mt-2" :trades="props.trades || []" @locate="handleTableLocate" />
  </div>
</template>

<style scoped>
.trading-analysis {
  margin-top: 10px;
  padding: 0;
}

.ant-card {
  border-radius: 8px;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
