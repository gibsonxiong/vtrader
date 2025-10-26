<script lang="ts" setup>
import { Modal, message, DatePicker } from 'ant-design-vue';
import { computed, ref, onMounted, onBeforeUnmount, watch, defineExpose, nextTick, reactive } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { init, dispose, utils } from 'klinecharts';
import type { Chart } from 'klinecharts';
import { getBarsApi, type MarketDataApi } from '#/api';
import { Direction, Interval, Offset, type BarData, type TradeData } from '@vtrader/shared';
import ContractList from './ContractList.vue';
import './signal-overlay';

type ContractData = MarketDataApi.ContractData;

interface Props {
  symbol: string;
  interval: Interval;
  start: Dayjs;
  end: Dayjs;
  trades?: TradeData[];
}

const props = withDefaults(defineProps<Props>(), {
  trades: () => [],
});

const emit = defineEmits<{
}>();

const innerProps = reactive({
  symbol: props.symbol,
  interval: props.interval,
  start: props.start,
  end: props.end,
})
const loading = ref(false);
const showContractModal = ref(false);
const contractListRef = ref<InstanceType<typeof ContractList> | null>(null);

// 工具栏相关
const periodOptions = [
  { label: '1m', value: Interval.MINUTE_1 },
  { label: '5m', value: Interval.MINUTE_5 },
  { label: '15m', value: Interval.MINUTE_15 },
  { label: '1H', value: Interval.HOUR_1 },
  { label: '2H', value: Interval.HOUR_2 },
  { label: '4H', value: Interval.HOUR_4 },
  { label: 'D', value: Interval.DAILY_1 },
  { label: 'W', value: Interval.WEEKLY_1 },
  { label: 'M', value: Interval.MONTHLY_1 },
  { label: 'Y', value: Interval.MONTHLY_1 }, // 暂时使用月线代替年线
]

const isFullscreen = ref(false)

const chartDivRef = ref<HTMLDivElement | null>(null);
let klineChart: Chart | null = null;
let resizeObserver: ResizeObserver | null = null;

// 交易信号类型
interface TradeSignal {
  timestamp: number;
  price: number;
  type: 'buy' | 'sell';
  trade: TradeData;
}

// 显示合约选择模态框
function showContractSelector() {
  showContractModal.value = true;
}

// 选择合约
function onContractSelected(contract: ContractData) {
  innerProps.symbol = contract.symbol;
  showContractModal.value = false;
}

// 周期切换
function changeInterval(interval: Interval) {
  innerProps.interval = interval;
}

// 全屏切换
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  // 这里可以添加实际的全屏逻辑
}

// 工具按钮处理函数
function handleIndicators() {
  message.info('指标功能开发中...');
}

function handleSettings() {
  message.info('设置功能开发中...');
}

function handleScreenshot() {
  message.info('截屏功能开发中...');
}


function mapBarsToKLineData(list: BarData[]) {
  return list.map((b) => ({
    timestamp: Number(b.timestamp),
    open: Number(b.open),
    high: Number(b.high),
    low: Number(b.low),
    close: Number(b.close),
    volume: Number(b.volume),
  }));
}

function intervalToPeriod(interval: Interval): { span: number; type: 'minute' | 'hour' | 'day' } {
  switch (interval) {
    case Interval.MINUTE_1:
      return { span: 1, type: 'minute' };
    case Interval.MINUTE_5:
      return { span: 5, type: 'minute' };
    case Interval.MINUTE_15:
      return { span: 15, type: 'minute' };
    case Interval.HOUR_1:
      return { span: 1, type: 'hour' };
    case Interval.HOUR_4:
      return { span: 4, type: 'hour' };
    case Interval.DAILY_1:
    default:
      return { span: 1, type: 'day' };
  }
}

// 图表自适应调整大小
function resizeChart() {
  if (klineChart && chartDivRef.value) {
    // 使用 klinecharts 的 resize 方法来调整图表大小
    klineChart.resize();
  }
}

// 设置 ResizeObserver 监听容器大小变化
function setupResizeObserver() {
  if (!chartDivRef.value) return;
  
  resizeObserver = new ResizeObserver(() => {
    // 使用 requestAnimationFrame 来优化性能，避免频繁调用
    requestAnimationFrame(() => {
      resizeChart();
    });
  });
  
  resizeObserver.observe(chartDivRef.value);
}

// 清理 ResizeObserver
function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

// 将 TradeData 转换为交易信号
function mapTradesToSignals(trades: TradeData[], data: BarData[]): TradeSignal[] {
  const firstBar = data[0];
  const endBar = data[data.length - 1];
  const result: TradeSignal[] = [];
  trades.forEach(trade => {
    const timestamp = new Date(trade.time).getTime();
    if (firstBar && endBar && (timestamp < firstBar.timestamp || timestamp > endBar.timestamp)) return;

    // 根据 direction 和 offset 判断买卖信号
    // 开多(LONG + OPEN) 和 平空(SHORT + CLOSE) 为买信号
    // 开空(SHORT + OPEN) 和 平多(LONG + CLOSE) 为卖信号
    let signalType: 'buy' | 'sell';
    
    if ((trade.direction === Direction.LONG && trade.offset === Offset.OPEN) || 
        (trade.direction === Direction.SHORT && trade.offset === Offset.CLOSE)) {
      signalType = 'buy';
    } else {
      signalType = 'sell';
    }

    result.push({
      timestamp: new Date(trade.time).getTime(),
      price: Number(trade.price),
      type: signalType,
      trade
    });
  });

  return result;
}

// 添加交易信号到图表
function addTradeSignalsToChart(signals: TradeSignal[]) {
  if (!klineChart) return;

  // 清除之前的交易信号覆盖层
  klineChart.removeOverlay();

  // 为每个信号创建覆盖层
  signals.forEach((signal, index) => {
    const overlayId = `trade-signal-${index}`;
    const isBuy = signal.type === 'buy';
    
    klineChart?.createOverlay({
      name: 'signal',
      id: overlayId,
      points: [
        {
          timestamp: signal.timestamp,
          value: signal.price
        }
      ],
      styles: {
        line: {
          color: '#666',
        },
        polygon: {
          color: isBuy ? '#ff4d4f' : '#52c41a',
        },
        text: {
          backgroundColor: isBuy ? '#ff4d4f' : '#52c41a',
          color: isBuy ? '#fff' : '#fff',
        },
      },
      extendData: {
        isBuy,
        text: isBuy ? 'B' : 'S'
      }
    });
  });
}

// 更新交易信号显示
function updateTradeSignals(data: BarData[]) {
  if (!props.trades || props.trades.length === 0) {
    // 如果没有交易数据，清除所有信号
    if (klineChart) {
      klineChart.removeOverlay();
    }
    return;
  }

  const signals = mapTradesToSignals(props.trades, data);
  addTradeSignalsToChart(signals);
}

async function fetchBars() {
  if (!klineChart) {
    message.error('图表未初始化');
    return;
  }
  try {
    loading.value = true;
    const period = intervalToPeriod(innerProps.interval);
    // 设置交易对与周期，v10 推荐通过 setDataLoader 提供数据
    klineChart.setSymbol({ ticker: innerProps.symbol });
    klineChart.setPeriod(period);

    klineChart.setDataLoader({
      getBars: async ({ callback }) => {
        try {
          const params: MarketDataApi.BarQueryParams = {
            symbol: innerProps.symbol,
            interval: innerProps.interval,
            start: innerProps.start?.format('YYYY-MM-DD'),
            source: 'broker',
          };
          if (innerProps.end) params.end = innerProps.end.format('YYYY-MM-DD');
          
          const {data} = await getBarsApi(params);
          callback(mapBarsToKLineData(data));
          updateTradeSignals(data);
          nextTick(() => {
            klineChart?.scrollToDataIndex(100, 0);
          });
        } catch (err: any) {
          message.error('获取K线失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
          callback([]);
        } finally {
          loading.value = false;
        }
      },
    });
  } catch (err: any) {
    loading.value = false;
    message.error('获取K线失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
  }
}



// 监听props变化
watch(() => props, () => {
  Object.assign(innerProps, props);
}, {
  deep: true,
});

watch(() => innerProps, () => {
  fetchBars();
}, {
  deep: true,
})

// // 监听 trades 属性变化
// watch(() => props.trades, () => {
//   updateTradeSignals();
// }, {
//   deep: true,
//   immediate: true,
// });

onMounted(() => {
  if (chartDivRef.value) {
    klineChart = init(chartDivRef.value, {
      locale: 'zh-CN',
      styles: 'custom',
      formatter: {
        formatDate: ({
          dateTimeFormat,
          timestamp,
          type
        }) => {
          // switch (type) {
          //   case 'tooltip': {
          //     return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
          //   }
          //   case 'crosshair': {
          //     return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
          //   }
          //   case 'xAxis': {
          //     return utils.formatDate(dateTimeFormat, timestamp, 'MM-DD')
          //   }
          //   default: 
          //     return utils.formatDate(dateTimeFormat, timestamp, 'MM-DD HH:mm')
          // }
          return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
        }
      }
    });

    if (!klineChart) return;

    // 在底部新增成交量指标面板（VOL），高度约 100px
    try {
      klineChart.createIndicator({
        name: 'VOL',
        calcParams: [],
        series: 'normal',
      }, false, { 
        height: 100,
      });
    } catch (e) {
      // 忽略可能的 v10 alpha 版本 API 差异导致的异常，不影响主图显示
      console.warn('Create VOL indicator failed:', e);
    }

    // 设置 ResizeObserver 监听容器大小变化
    setupResizeObserver();

    // 首次加载
    fetchBars();
  }
});

onBeforeUnmount(() => {
  // 清理 ResizeObserver
  cleanupResizeObserver();
  
  if (klineChart) {
    dispose(klineChart);
    klineChart = null;
  }
});

defineExpose({
  fetchBars,
});

</script>

<template>
  <div class="market-data-chart">
    <div class="chart-container" :class="{ fullscreen: isFullscreen }">
      <!-- 顶部工具栏 -->
      <div class="chart-toolbar">
        <div class="toolbar-left">
          <button class="contract-selector-btn" @click="showContractSelector" title="选择合约">
            {{ innerProps.symbol }}
          </button>
          <div class="period-buttons">
            <button
              v-for="period in periodOptions"
              :key="period.value"
              class="period-btn"
              :class="{ active: innerProps.interval === period.value }"
              @click="changeInterval(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
          
          <!-- 日期选择器 -->
          <div class="date-selectors">
            <div class="date-selector-group">
              <DatePicker
                v-model:value="innerProps.start"
                format="YYYY-MM-DD"
                placeholder="选择开始日期"
                class="date-picker"
                :allowClear="false"
              />
            </div>
            <div class="date-selector-group">
              <DatePicker
                v-model:value="innerProps.end"
                format="YYYY-MM-DD"
                placeholder="选择结束日期"
                class="date-picker"
                :allowClear="false"
              />
            </div>
          </div>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="handleIndicators" title="指标">
            📊 指标
          </button>
          <button class="tool-btn" @click="handleSettings" title="设置">
            ⚙️ 设置
          </button>
          <button class="tool-btn" @click="handleScreenshot" title="截屏">
            📷 截屏
          </button>
          <button class="tool-btn" @click="toggleFullscreen" title="全屏">
            🔍 全屏
          </button>
        </div>
      </div>
      
      <!-- K线图容器 -->
      <div ref="chartDivRef" class="chart-content">
        <!-- 加载中提示 -->
        <div v-if="loading" class="chart-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
      </div>
      
      <!-- 合约选择模态框 -->
      <Modal
        v-model:open="showContractModal"
        title="选择合约"
        :width="400"
        :footer="null"
        :destroyOnClose="true"
      >
        <ContractList
          ref="contractListRef"
          :selectedSymbol="innerProps.symbol"
          @contractSelected="onContractSelected"
        />
      </Modal>
    </div>
  </div>
</template>

<style scoped>
.market-data-chart {
  height: 700px;
  width: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  min-height: 48px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.contract-selector-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  transition: all 0.2s;
  min-width: 120px;
  text-align: left;
}

.contract-selector-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.period-buttons {
  display: flex;
  gap: 4px;
}

.period-btn {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.period-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.period-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.date-selectors {
  display: flex;
  gap: 5px;
  align-items: center;
}

.date-selector-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  margin: 0;
}

.date-picker {
  width: 140px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.chart-content {
  flex: 1;
  width: 100%;
  height: calc(100% - 48px);
  position: relative;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: white;
}
</style>
