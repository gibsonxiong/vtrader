<script lang="ts" setup>
import { JsonViewer, Page } from '@vtrader/common-ui';
import { Card, Statistic, Row, Col, Tag, Descriptions, Spin, message, Tabs } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import dayjs from 'dayjs';
import TradingAnalysis from './components/TradingAnalysis.vue';


const route = useRoute();

const state = reactive({
  data: null as any,
  loading: false,
  activeTab: '1', // 默认显示概况
});

// 获取回测结果数据
const fetchBacktestResult = async () => {
  const resultId = route.query.resultId;
  if (!resultId) {
    message.error('缺少回测结果ID');
    return;
  }

  state.loading = true;
  try {
    const response = await axios.get(`http://127.0.0.1:3000/backtesting/${resultId}`);
    state.data = response.data.data;
  } catch (error) {
    console.error('获取回测结果失败:', error);
    message.error('获取回测结果失败');
  } finally {
    state.loading = false;
  }
};

// 格式化百分比
const formatPercentage = (value: number | null) => {
  if (value == null) return '--';
  return (value * 100).toFixed(2) + '%';
};

// 格式化数字
const formatNumber = (value: number | null, decimals: number = 2) => {
  if (value == null) return '--';
  return value.toFixed(decimals);
};

onMounted(() => {
  fetchBacktestResult();
});
</script>

<template>
  <Page title="回测结果">
    <div class="p-6">
      <Spin :spinning="state.loading">
        <div v-if="state.data" class="space-y-6">
          <!-- Tab导航 -->
          <Tabs v-model:activeKey="state.activeTab" type="card" class="mb-6">
            <Tabs.TabPane key="1" tab="概况">
              <!-- 概况内容 -->
          <!-- 基本信息卡片 -->
          <Card title="基本信息" class="shadow-sm">
            <Descriptions :column="3" bordered>
              <Descriptions.Item label="回测ID">{{ state.data.id }}</Descriptions.Item>
              <Descriptions.Item label="策略名称">{{ state.data.strategyName }}</Descriptions.Item>
              <Descriptions.Item label="交易对">{{ state.data.symbol }}</Descriptions.Item>
              <Descriptions.Item label="时间间隔">{{ state.data.interval }}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {{ dayjs(state.data.startDate).format('YYYY-MM-DD') }}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {{ dayjs(state.data.endDate).format('YYYY-MM-DD') }}
              </Descriptions.Item>
            </Descriptions>
          </Card>



          <!-- 回测结果卡片 -->
          <Card title="回测结果" class="shadow-sm">
            <Row :gutter="24">
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="总收益率"
                    :value="formatPercentage(state.data.totalReturnPercent)"
                    :value-style="{ 
                      color: state.data.total_return && state.data.total_return >= 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="年化收益率"
                    :value="formatPercentage(state.data.annual_return)"
                    :value-style="{ 
                      color: state.data.annual_return && state.data.annual_return >= 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="最大回撤"
                    :value="formatPercentage(state.data.max_drawdown)"
                    :value-style="{ 
                      color: '#ff4d4f',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
            </Row>
            
            <Row :gutter="24" class="mt-6">
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="夏普比率"
                    :value="formatNumber(state.data.sharpe_ratio, 3)"
                    :value-style="{ 
                      color: state.data.sharpe_ratio && state.data.sharpe_ratio >= 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="总交易次数"
                    :value="state.data.total_trades || '--'"
                    :value-style="{ 
                      color: '#1890ff',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card class="text-center">
                  <Statistic
                    title="胜率"
                    :value="formatPercentage(state.data.win_rate)"
                    :value-style="{ 
                      color: state.data.win_rate && state.data.win_rate >= 0.5 ? '#52c41a' : '#ff4d4f',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }"
                  />
                </Card>
              </Col>
            </Row>
          </Card>

            </Tabs.TabPane>
            
            <Tabs.TabPane key="3" tab="交易分析">
              <!-- 交易分析内容 -->
              <TradingAnalysis :backtest-id="state.data?.id" :trades="state.data?.trades" />
            </Tabs.TabPane>
          </Tabs>
        </div>
        
        <div v-else-if="!state.loading" class="text-center py-12">
          <div class="text-gray-500 text-lg">暂无回测结果数据</div>
        </div>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.ant-statistic-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.ant-card {
  border-radius: 8px;
}

.shadow-sm {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
</style>
