<script lang="ts" setup>
import type { Interval, TradeData } from '@vtrader/shared';
import KlineChart from '#/components/KlineChart/index.vue';
import TradingTable from './TradingTable.vue';
import type { Dayjs } from 'dayjs';

interface TradingAnalysisProps {
  backtestId?: number;
  symbol: string;
  interval: Interval;
  start: Dayjs;
  end: Dayjs;
  trades?: TradeData[];
}

const props = defineProps<TradingAnalysisProps>();
</script>

<template>
  <div class="trading-analysis">
    <!-- K线图表组件 -->
    <KlineChart 
    :symbol="props.symbol" 
    :interval="props.interval" 
    :start="props.start" 
    :end="props.end"
    :trades="props.trades || []" />
    <!-- 交易明细表格组件 -->
    <TradingTable :trades="props.trades || []" />
  </div>
</template>

<style scoped>
.trading-analysis {
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
