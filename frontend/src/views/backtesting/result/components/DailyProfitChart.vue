<script lang="ts" setup>
import * as echarts from 'echarts';
import { computed, onMounted, ref, watch } from 'vue';

interface DailyResultItem {
  date: string;
  netPnl: number;
  accumNetPnl: number;
}

const props = defineProps<{ dailyResults?: DailyResultItem[] }>();

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const dates = computed(() => (props.dailyResults || []).map((d) => d.date));
const netPnls = computed(() => (props.dailyResults || []).map((d) => d.netPnl));
const accumNetPnls = computed(() => (props.dailyResults || []).map((d) => d.accumNetPnl));

function render() {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const vals = netPnls.value;
  const accVals = accumNetPnls.value;
  const pad = 1.1;
  const maxAbs = vals.length ? Math.max(...vals.map((v) => Math.abs(v))) : 1;
  const maxAbsAccum = accVals.length ? Math.max(...accVals.map((v) => Math.abs(v))) : 1;
  const maxAbsPadded = maxAbs * pad;
  const maxAbsAccumPadded = maxAbsAccum * pad;

  type Unit = 'yuan' | 'wan' | 'percent';
  const unitFor = (vs: number[]): Unit => {
    const m = vs.length ? Math.max(...vs.map((v) => Math.abs(v))) : 0;
    if (m > 0 && m < 1) return 'percent';
    if (m >= 10000) return 'wan';
    return 'yuan';
  };
  const unitLeft: Unit = unitFor(vals);
  const unitRight: Unit = unitFor(accVals);
  const formatValue = (v: number, unit: Unit) => {
    if (unit === 'percent') return `${(v * 100).toFixed(2)}%`;
    if (unit === 'wan') return `${(v / 10000).toFixed(2)}万`;
    return `${v.toFixed(2)}`;
  };

  chartInstance.setOption({
    grid: { left: '3%', right: '3%', top: '20%', bottom: '3%', containLabel: true },
    legend: {
      data: ['当日收益', '累计收益'],
      top: '5%',
      left: 'center',
      itemGap: 20,
      textStyle: { fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any) => {
        const date = params?.[0]?.axisValueLabel ?? '';
        const bar = params?.find((p: any) => p.seriesName === '当日收益');
        const line = params?.find((p: any) => p.seriesName === '累计收益');
        const net = bar ? bar.data : 0;
        const accum = line ? line.data : 0;
        const netColor = net >= 0 ? '#ff4d4f' : '#52c41a';
        const accumColor = accum >= 0 ? '#ff4d4f' : '#52c41a';
        return `${date}<br/>当日收益：<span style="color: ${netColor};">${formatValue(net, unitLeft)}</span><br/>累计收益：<span style="color: ${accumColor};">${formatValue(accum, unitRight)}</span>`;
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      axisTick: { show: false },
      axisLine: { onZero: true, lineStyle: { color: '#e5e5e5' } },
      axisLabel: { color: '#666' },
      data: dates.value,
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true },
        min: -maxAbsPadded,
        max: maxAbsPadded,
        splitNumber: 4,
        interval: (maxAbsPadded * 2) / 4,
        axisLabel: { formatter: (value: number) => formatValue(value, unitLeft) },
      },
      {
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        min: -maxAbsAccumPadded,
        max: maxAbsAccumPadded,
        splitNumber: 4,
        interval: (maxAbsAccumPadded * 2) / 4,
        axisLabel: { formatter: (value: number) => formatValue(value, unitRight) },
      },
    ],
    series: [
      {
        name: '当日收益',
        type: 'bar',
        yAxisIndex: 0,
        data: netPnls.value,
        barMaxWidth: 40,
        itemStyle: {
          color: (params: any) => (params.value >= 0 ? '#ff4d4f' : '#52c41a'),
        },
      },
      {
        name: '累计收益',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        data: accumNetPnls.value,
        itemStyle: { color: '#5ab1ef' },
        lineStyle: { color: '#5ab1ef' },
      },
    ],
  });
}

onMounted(() => render());

watch(() => props.dailyResults, () => render(), { deep: true });
</script>

<template>
  <div>
    <div ref="chartRef" style="width:100%;height:400px" />
    <div v-if="!props.dailyResults || props.dailyResults.length === 0" class="text-center text-gray-500 py-4">
      暂无每日收益数据
    </div>
  </div>
</template>
