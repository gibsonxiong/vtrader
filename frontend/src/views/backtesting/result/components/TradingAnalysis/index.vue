<script lang="ts" setup>
import type { Interval, TradeData } from '@vtrader/shared';
import KlineChart from '#/components/KlineChart/index.vue';
import TradingTable from './TradingTable.vue';
import type { Dayjs } from 'dayjs';
import { watch } from 'vue';

interface TradingAnalysisProps {
  brokerId: string;
  symbol: string;
  interval: Interval;
  start: Dayjs;
  end: Dayjs;
  trades?: TradeData[];
}

const props = defineProps<TradingAnalysisProps>();

watch(() => props.symbol, (start) => {
  debugger;
});

watch(() => props.start, (start) => {
  debugger;
});

</script>

<template>
  <div class="trading-analysis">
    <!-- K线图表组件 -->
    <KlineChart
      :brokerId="props.brokerId"
      :symbol="props.symbol" 
      :interval="props.interval" 
      :startDate="props.start" 
      :endDate="props.end"
      :trades="props.trades || []"
    />
    <!-- 交易明细表格组件 -->
    <TradingTable class="mt-2" :trades="props.trades || []" />
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
