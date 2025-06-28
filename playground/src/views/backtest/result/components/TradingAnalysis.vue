<script lang="ts" setup>
import TradingChart from './TradingChart.vue';
import TradingTable from './TradingTable.vue';

interface TradingAnalysisProps {
  backtestId?: number;
}

const props = defineProps<TradingAnalysisProps>();




</script>

<template>
  <div class="trading-analysis">
    <!-- K线图表组件 -->
    <TradingChart :backtest-id="props.backtestId" />



    <!-- 交易明细表格组件 -->
    <TradingTable :backtest-id="props.backtestId" />
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
