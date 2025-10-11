<script lang="ts" setup>
import type { TradeData } from '#/shared/types/common';
import TradingChart from './TradingChart.vue';
import TradingTable from './TradingTable.vue';

interface TradingAnalysisProps {
  backtestId?: number;
  trades?: TradeData[];
}

const props = defineProps<TradingAnalysisProps>();




</script>

<template>
  <div class="trading-analysis">
    <!-- K线图表组件 -->
    <TradingChart :backtest-id="props.backtestId" />
    <!-- 交易明细表格组件 -->
    <TradingTable :trades="props.trades" />
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
