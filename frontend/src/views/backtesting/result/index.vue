<script lang="ts" setup>
import { JsonViewer, Page } from '@vtrader/common-ui';
import { Card, Statistic, Row, Col, Tag, Descriptions, Spin, message, Tabs, Table, Input, Button } from 'ant-design-vue';
import { reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getBacktestResultApi } from '#/api';
import dayjs from 'dayjs';
import TradingAnalysis from './components/TradingAnalysis/index.vue';
import DailyProfitChart from './components/DailyProfitChart.vue';


const route = useRoute();

const state = reactive({
  data: null as any,
  loading: false,
  activeTab: '1', // 默认显示概况
});

// 新增：对比状态（输入框）
const compare = reactive({
  id: '',
  loading: false,
});
// 新增：多回测对比列表
const compares = reactive<{ id: string; data: any }[]>([]);

// 获取回测结果数据（现有）
const fetchBacktestResult = async () => {
  const resultId = route.query.resultId;
  if (!resultId) {
    message.error('缺少回测结果ID');
    return;
  }

  state.loading = true;
  try {
    const response = await getBacktestResultApi({
      id: Number(resultId)
    });
    state.data = response.data?.data.model;
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

// 新增：添加对比回测到列表
const addCompare = async () => {
  if (!compare.id) {
    message.warn('请输入对比回测ID');
    return;
  }
  if (compares.some((c) => c.id === compare.id)) {
    message.warn('该对比ID已在列表中');
    return;
  }
  compare.loading = true;
  try {
    const response = await getBacktestResultApi({
      id: Number(compare.id)
    });
    compares.push({ id: compare.id, data: response.data?.data.model });
    message.success('已添加对比');
    compare.id = '';
  } catch (error) {
    console.error('获取对比回测结果失败:', error);
    message.error('获取对比回测结果失败');
  } finally {
    compare.loading = false;
  }
};
// 新增：移除单个对比
const removeCompare = (id: string) => {
  const idx = compares.findIndex((c) => c.id === id);
  if (idx !== -1) {
    compares.splice(idx, 1);
    message.info(`已移除对比：${id}`);
  }
};
// 新增：移除全部对比
const clearAllCompares = () => {
  compares.length = 0;
  compare.id = '';
  message.info('已移除全部对比');
};

// 列定义：通用比较表格（根据对比列表动态扩展列）
const compareColumns = computed(() => {
  const cols: any[] = [
    { title: '指标', dataIndex: 'label', key: 'label', width: 180 },
    { title: '当前', dataIndex: 'current', key: 'current' },
  ];
  compares.forEach((c, idx) => {
    cols.push({ title: `对比${idx + 1}(${c.id})`, dataIndex: `compare_${c.id}`, key: `compare_${c.id}` });
  });
  return cols;
});

// 新增：构建基本信息比较行（为每个对比填充动态列）
const buildBasicInfoRows = () => {
  if (!state.data) return [] as any[];
  const rows: any[] = [
    { key: 'id', label: '回测ID', type: 'text', currentRaw: null, current: state.data.id },
    { key: 'strategyName', label: '策略名称', type: 'text', currentRaw: null, current: state.data.strategyName },
    { key: 'symbol', label: '交易对', type: 'text', currentRaw: null, current: state.data.symbol },
    { key: 'interval', label: '时间间隔', type: 'text', currentRaw: null, current: state.data.interval },
    { key: 'startDate', label: '开始时间', type: 'text', currentRaw: null, current: state.data.startDate ? dayjs(state.data.startDate).format('YYYY-MM-DD') : '--' },
    { key: 'endDate', label: '结束时间', type: 'text', currentRaw: null, current: state.data.endDate ? dayjs(state.data.endDate).format('YYYY-MM-DD') : '--' },
    { key: 'totalReturnPercent', label: '总收益率', type: 'percentage', currentRaw: state.data.totalReturnPercent ?? null, current: formatPercentage(state.data.totalReturnPercent) },
     { key: 'maxDrawdownPercent', label: '最大回撤率', type: 'percentage', currentRaw: state.data.maxDrawdownPercent ?? null, current: formatPercentage(state.data.maxDrawdownPercent) },
  ];
  compares.forEach((c) => {
    rows.forEach((row) => {
      let v = '--';
      switch (row.key) {
        case 'id': v = c.data?.id ?? '--'; break;
        case 'strategyName': v = c.data?.strategyName ?? '--'; break;
        case 'symbol': v = c.data?.symbol ?? '--'; break;
        case 'interval': v = c.data?.interval ?? '--'; break;
        case 'startDate': v = c.data?.startDate ? dayjs(c.data.startDate).format('YYYY-MM-DD') : '--'; break;
        case 'endDate': v = c.data?.endDate ? dayjs(c.data.endDate).format('YYYY-MM-DD') : '--'; break;
        case 'totalReturnPercent': v = c.data?.totalReturnPercent ?? null; v = c.data ? formatPercentage(c.data.totalReturnPercent) : '--'; break;
        case 'maxDrawdownPercent': v = c.data?.maxDrawdownPercent ?? null; v = c.data ? formatPercentage(c.data.maxDrawdownPercent) : '--'; break;
      }
      row[`compare_${c.id}`] = v;
      row[`compareRaw_${c.id}`] = null;
    });
  });
  return rows;
};

// 新增：构建回测结果比较行（为每个对比填充动态列）
// const buildResultRows = () => {
//   if (!state.data) return [] as any[];
//   const rows: any[] = [
    
//     { key: 'annual_return', label: '年化收益率', type: 'percentage', currentRaw: state.data.annual_return ?? null, current: formatPercentage(state.data.annual_return) },
//     { key: 'max_drawdown', label: '最大回撤', type: 'percentage', currentRaw: state.data.max_drawdown ?? null, current: formatPercentage(state.data.max_drawdown) },
//     { key: 'sharpe_ratio', label: '夏普比率', type: 'number', currentRaw: state.data.sharpe_ratio ?? null, current: formatNumber(state.data.sharpe_ratio, 3) },
//     { key: 'total_trades', label: '总交易次数', type: 'number', currentRaw: state.data.total_trades ?? null, current: state.data.total_trades ?? '--' },
//     { key: 'win_rate', label: '胜率', type: 'percentage', currentRaw: state.data.win_rate ?? null, current: formatPercentage(state.data.win_rate) },
//   ];
//   compares.forEach((c) => {
//     rows.forEach((row) => {
//       let v: any = '--';
//       let vr: number | null = null;
//       switch (row.key) {
//         case 'totalReturnPercent': vr = c.data?.totalReturnPercent ?? null; v = c.data ? formatPercentage(c.data.totalReturnPercent) : '--'; break;
//         case 'annual_return': vr = c.data?.annual_return ?? null; v = c.data ? formatPercentage(c.data.annual_return) : '--'; break;
//         case 'max_drawdown': vr = c.data?.max_drawdown ?? null; v = c.data ? formatPercentage(c.data.max_drawdown) : '--'; break;
//         case 'sharpe_ratio': vr = c.data?.sharpe_ratio ?? null; v = c.data ? formatNumber(c.data.sharpe_ratio, 3) : '--'; break;
//         case 'total_trades': vr = c.data?.total_trades ?? null; v = c.data ? (c.data.total_trades ?? '--') : '--'; break;
//         case 'win_rate': vr = c.data?.win_rate ?? null; v = c.data ? formatPercentage(c.data.win_rate) : '--'; break;
//       }
//       row[`compare_${c.id}`] = v;
//       row[`compareRaw_${c.id}`] = vr;
//     });
//   });
//   return rows;
// };
const combinedRows = computed(() => {
  const basic = buildBasicInfoRows();
  // const result = buildResultRows();
  return [...basic];
});
onMounted(() => {
  fetchBacktestResult();
});
// 差异高亮辅助：返回箭头和颜色
const diffArrow = (current: number | null, compare: number | null) => {
  if (current == null || compare == null) return '';
  if (compare === current) return '';
  return compare > current ? '▲' : '▼';
};
const diffColor = (current: number | null, compare: number | null): string | undefined => {
  if (current == null || compare == null) return undefined;
  if (compare === current) return undefined;
  // 按用户规则：更优红色，更差绿色
  return compare > current ? '#ff4d4f' : '#52c41a';
};
</script>

<template>
  <Page title="回测结果">
    <div class="p-6">
      <Spin :spinning="state.loading || compare.loading">
        <div v-if="state.data" class="space-y-6">
          <!-- Tab导航 -->
          <Tabs v-model:activeKey="state.activeTab" type="card" class="mb-6">
            <Tabs.TabPane key="1" tab="概况">
              <!-- 概况内容 -->
              <!-- 已按你的要求移除：基本信息卡片 和 回测结果卡片 -->
              
              <!-- 对比设置（支持多回测对比） -->
              <Card title="对比设置" class="shadow-sm">
                <Row :gutter="12" align="middle">
                  <Col :span="8">
                    <Input v-model:value="compare.id" placeholder="请输入对比回测ID" />
                  </Col>
                  <Col>
                    <Button type="primary" :loading="compare.loading" @click="addCompare">添加对比</Button>
                  </Col>
                  <Col v-if="compares.length > 0">
                    <Tag
                      v-for="c in compares"
                      :key="c.id"
                      color="blue"
                      closable
                      @close="removeCompare(c.id)"
                      class="mr-2"
                    >
                      对比：{{ c.id }}
                    </Tag>
                  </Col>
                  <Col v-if="compares.length > 0">
                    <Button danger @click="clearAllCompares" :disabled="compare.loading">清空全部对比</Button>
                  </Col>
                </Row>
              </Card>
              
              <!-- 综合对比表格 -->
              <Card title="综合对比" class="shadow-sm">
                <Table
                  :columns="compareColumns"
                  :data-source="combinedRows"
                  :pagination="false"
                  row-key="key"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'current'">
                      {{ record.current }}
                    </template>
                    <template v-else-if="String(column.key).startsWith('compare_')">
                      <span
                        :style="{
                          color: record.type !== 'text'
                            ? diffColor(
                                record.currentRaw,
                                record[`compareRaw_${String(column.key).replace('compare_', '')}`]
                              )
                            : undefined,
                        }"
                      >
                        {{ record[column.dataIndex] }}
                      </span>
                      <span
                        v-if="record.type !== 'text' && diffArrow(
                          record.currentRaw,
                          record[`compareRaw_${String(column.key).replace('compare_', '')}`]
                        )"
                        :style="{
                          color: diffColor(
                            record.currentRaw,
                            record[`compareRaw_${String(column.key).replace('compare_', '')}`]
                          )
                        }"
                        style="margin-left: 4px;"
                      >
                        {{
                          diffArrow(
                            record.currentRaw,
                            record[`compareRaw_${String(column.key).replace('compare_', '')}`]
                          )
                        }}
                      </span>
                    </template>
                    <template v-else>
                      {{ record[column.dataIndex] }}
                    </template>
                  </template>
                </Table>
              </Card>
              
            </Tabs.TabPane>
            
            <Tabs.TabPane key="3" tab="交易分析">
              <!-- 每日收益图表 -->
              <Card title="每日收益" class="shadow-sm mt-4">
                <DailyProfitChart :daily-results="state.data?.dailyResults || []" />
              </Card>
              <!-- 交易分析内容 -->
              <TradingAnalysis
                v-if="state.data"
                :backtest-id="state.data?.id" 
                :symbol="state.data?.symbol"
                :interval="state.data?.interval"
                :start="dayjs(state.data?.startDate)"
                :end="dayjs(state.data?.endDate)"
                :trades="state.data?.trades" 
              />
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
