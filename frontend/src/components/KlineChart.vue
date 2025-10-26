<script lang="ts" setup>
import { Loading } from '@vtrader/common-ui';
import { Form, Input, Button, DatePicker, Select, Space, message } from 'ant-design-vue';
import { reactive, ref, onMounted, onBeforeUnmount, watch, defineExpose } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { init, dispose } from 'klinecharts';
import type { Chart } from 'klinecharts';
import { getContractsApi, getBarsApi, downloadBarsApi, type MarketDataApi } from '#/api';
import { Direction, Interval, Offset, type BarData, type TradeData } from '@vtrader/shared';
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
  barsUpdated: [bars: BarData[]];
  symbolChanged: [symbol: string];
}>();

const loading = ref(false);
const bars = ref<BarData[]>([]);
const contracts = ref<ContractData[]>([]);
const contractsLoading = ref(false);

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

// 获取合约列表
async function fetchContracts() {
  try {
    contractsLoading.value = true;
    const {data} = await getContractsApi();
    contracts.value = data || [];
  } catch (err: any) {
    message.error('获取合约失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
    contracts.value = [];
  } finally {
    contractsLoading.value = false;
  }
}

// 选择合约后切换 symbol 并刷新K线
function selectSymbol(c: ContractData) {
  if (!c?.symbol) return;
  emit('symbolChanged', c.symbol);
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
function mapTradesToSignals(trades: TradeData[]): TradeSignal[] {
  return trades.map(trade => {
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

    return {
      timestamp: new Date(trade.time).getTime(),
      price: Number(trade.price),
      type: signalType,
      trade
    };
  });
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
function updateTradeSignals() {
  if (!props.trades || props.trades.length === 0) {
    // 如果没有交易数据，清除所有信号
    if (klineChart) {
      klineChart.removeOverlay();
    }
    return;
  }

  const signals = mapTradesToSignals(props.trades);
  addTradeSignalsToChart(signals);
}

async function fetchBars() {
  if (!klineChart) {
    message.error('图表未初始化');
    return;
  }
  try {
    loading.value = true;
    const period = intervalToPeriod(props.interval);
    // 设置交易对与周期，v10 推荐通过 setDataLoader 提供数据
    klineChart.setSymbol({ ticker: props.symbol });
    klineChart.setPeriod(period);

    klineChart.setDataLoader({
      getBars: async ({ callback }: any) => {
        try {
          const params: MarketDataApi.BarQueryParams = {
            symbol: props.symbol,
            interval: props.interval,
            start: props.start?.format('YYYY-MM-DD'),
          };
          if (props.end) params.end = props.end.format('YYYY-MM-DD');
          
          const {data} = await getBarsApi(params);
          callback(mapBarsToKLineData(data));
          bars.value = data.reverse();
          emit('barsUpdated', bars.value);
          
          // 在K线数据加载完成后更新交易信号
          setTimeout(() => {
            updateTradeSignals();
          }, 100);
        } catch (err: any) {
          message.error('获取K线失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
          bars.value = [];
          callback([]);
          emit('barsUpdated', []);
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
  fetchBars();
}, {
  deep: true,
});

// 监听 trades 属性变化
watch(() => props.trades, () => {
  updateTradeSignals();
}, {
  deep: true,
  immediate: true,
});

onMounted(() => {
  // 初始化加载合约列表
  fetchContracts();
  
  if (chartDivRef.value) {
    klineChart = init(chartDivRef.value, {
      styles: 'custom'
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
    
    // 初始化交易信号显示
    updateTradeSignals();
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
    <div class="chart-container">
      <div class="symbol-list">
        <Loading :spinning="contractsLoading">
          <ul class="symbol-ul">
            <li
              v-for="c in contracts"
              :key="c.symbol"
              class="symbol-item"
              :class="{ active: c.symbol === props.symbol }"
              :title="c.symbol"
              @click="selectSymbol(c)"
            >
              {{ c.name }}
            </li>
          </ul>
        </Loading>
      </div>
      <div ref="chartDivRef" class="mt-4 kline-container"></div>
    </div>
  </div>
</template>

<style scoped>
.market-data-chart {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.kline-container {
  flex: 1;
  height: 600px;
  border: 1px solid #999;
  border-radius: 4px;
}

.chart-container {
  display: flex;
  align-items: flex-start;
}

.symbol-list {
  min-width: 240px;
  height: 600px;
  border: 1px solid #999;
  border-radius: 4px;
  padding: 8px;
  overflow-y: auto;
  margin-right: 16px;
  margin-top: 16px;
}

.symbol-ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.symbol-item {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.symbol-item:hover {
  background: #f5f7fa;
}

.symbol-item.active {
  background: #1890ff;
  color: white;
}

.symbol-item.active:hover {
  background: #40a9ff;
}
</style>
