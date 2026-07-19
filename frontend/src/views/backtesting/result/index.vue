<script lang="ts" setup>
import { Card, Statistic, Row, Col, Tag, Spin, message, Tabs } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getBacktestResultApi } from '#/api';
import dayjs from 'dayjs';
import TradingAnalysis from './components/TradingAnalysis/index.vue';
import DailyProfitChart from './components/DailyProfitChart.vue';

defineOptions({ name: 'BacktestResult' });

const route = useRoute();
const state = reactive({ data: null as any, loading: false, activeTab: '1' });

async function fetchBacktestResult() {
  const resultId = route.query.resultId;
  if (!resultId) { message.error('缺少回测结果ID'); return; }
  state.loading = true;
  try {
    const response = await getBacktestResultApi({ id: Number(resultId) });
    state.data = response.data?.data.model;
  } catch { message.error('获取回测结果失败'); }
  finally { state.loading = false; }
}

const formatPct = (v: number | null) => v == null ? '--' : (v * 100).toFixed(2) + '%';

onMounted(fetchBacktestResult);
</script>

<template>
  <div class="mobile-page">
    <Spin :spinning="state.loading">
      <div v-if="state.data">
        <Card size="small" style="margin-bottom:8px">
          <Row :gutter="[8,8]">
            <Col :span="8"><Statistic title="收益率" :value="formatPct(state.data.totalReturnPercent)" :value-style="{ color: state.data.totalReturnPercent >= 0 ? '#cf1322' : '#3f8600', fontSize: '16px' }" /></Col>
            <Col :span="8"><Statistic title="最大回撤" :value="formatPct(state.data.maxDrawdownPercent)" :value-style="{ fontSize: '16px' }" /></Col>
            <Col :span="8"><Statistic title="初始资金" :value="state.data.startBalance?.toLocaleString()" :value-style="{ fontSize: '14px' }" /></Col>
          </Row>
          <div style="margin-top:8px;font-size:12px;color:#999">
            {{ state.data.strategyName }} | {{ state.data.symbol }} {{ state.data.interval }}
            | {{ dayjs(state.data.startDate).format('YYYY-MM-DD') }} ~ {{ dayjs(state.data.endDate).format('YYYY-MM-DD') }}
          </div>
        </Card>

        <Card size="small" title="每日收益" style="margin-bottom:8px">
          <DailyProfitChart :daily-results="state.data?.dailyResults || []" />
        </Card>

        <TradingAnalysis
          v-if="state.data"
          :broker-id="state.data.brokerId"
          :symbol="state.data.symbol"
          :interval="state.data.interval"
          :start="dayjs(state.data.startDate)"
          :end="dayjs(state.data.endDate)"
          :trades="state.data.trades"
        />
      </div>
      <div v-else-if="!state.loading" style="text-align:center;padding:48px;color:#999">暂无数据</div>
    </Spin>
  </div>
</template>

<style scoped>
.mobile-page { padding: 0; }
</style>
