<script lang="ts" setup>
import { Card } from 'ant-design-vue';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { type Chart, init, dispose, type DataLoaderGetBarsParams, type KLineData } from 'klinecharts';
import dayjs from 'dayjs';

interface TradingChartProps {
  backtestId?: number;
}

const props = defineProps<TradingChartProps>();

const chartContainer = ref<HTMLDivElement>();
let chart: Chart | null;

// 初始化K线图
const initKlineChart = () => {
  if (!chartContainer.value) {
    console.warn('Chart container not found');
    return;
  }
  
  try {
    // 初始化K线图
    const initResult = init(chartContainer.value, {
      locale: 'zh-CN'
    });
    if (initResult) {
      chart = initResult;
    } else {
      throw new Error('初始化图表失败');
    }
    
    // 设置图表配置
    chart.setStyles({
      grid: {
        show: true,
        horizontal: {
          show: true,
          size: 1,
          color: '#E9EDF3',
          style: 'solid'
        },
        vertical: {
          show: true,
          size: 1,
          color: '#E9EDF3',
          style: 'solid'
        }
      },
      candle: {
        type: 'candle_solid',
        bar: {
          upColor: '#26A69A',
          downColor: '#EF5350',
          noChangeColor: '#888888'
        },
        tooltip: {
          showRule: 'always',
          showType: 'standard',
        }
      },
      xAxis: {
        show: true,
        size: 50,
        axisLine: {
          show: true,
          color: '#E9EDF3',
          size: 1
        },
        tickText: {
          show: true,
          color: '#76808F',
          size: 12
        }
      },
      yAxis: {
        show: true,
        size: 80,
        axisLine: {
          show: true,
          color: '#E9EDF3',
          size: 1
        },
        tickText: {
          show: true,
          color: '#76808F',
          size: 12
        }
      }
    });
    
    // 生成并设置模拟数据
    chart.setDataLoader({
      getBars: function (params: DataLoaderGetBarsParams): void | Promise<void> {
        setInterval(() => {
          params.callback(generateMockKlineData())
        }, 1000);
      }
    });
    
    // 设置图表标题
    chart.setSymbol({
      ticker: 'BTCUSDT',
      pricePrecision: 0,
      volumePrecision: 0
    });
    chart.setPeriod({ span: 1, type: 'day' });
    
  } catch (error) {
    console.error('初始化K线图失败:', error);
  }
};

let i = 0;
const data: KLineData[] = [];
let price = 50000;
// 生成模拟K线数据
const generateMockKlineData = () => {
  
  // for (let i = 0; i < 100; i++) {
    // 使用dayjs生成时间，从当前时间往前推100天
    const timestamp = dayjs().subtract(100 - i, 'day').valueOf();
    const open = price;
    const change = (Math.random() - 0.5) * 1000;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;
    const volume = Math.random() * 1000;
    
    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
    i++;
  // }
  
  return data;
};

onMounted( () => {
  initKlineChart();
});

onUnmounted(() => {
  if (chart) {
    dispose(chart);
    chart = null;
  }
});
</script>

<template>
  <Card title="价格走势" class="mb-6">
    <div ref="chartContainer" class="kline-chart-container"></div>
  </Card>
</template>

<style scoped>
.kline-chart-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.mb-6 {
  margin-bottom: 24px;
}
</style>
