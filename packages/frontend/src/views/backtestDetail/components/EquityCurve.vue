<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EquityCurvePoint } from '../index.vue'

const props = defineProps<{
  equityCurve: EquityCurvePoint[]
  initialCapital: number
}>()

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const range = ref<string>('all')
const rangeIndex = ref(0)
const chartData = ref<{ times: string[]; values: number[]; dailyValues: number[] }>({
  times: [],
  values: [],
  dailyValues: [],
})
const rangeOptions = [
  { value: 'all', label: '全部' },
  { value: '1m', label: '近一月' },
  { value: '3m', label: '近三月' },
  { value: '1y', label: '近一年' },
  { value: '3y', label: '近三年' },
]

const lastReturn = computed(() => {
  const d = chartData.value
  const len = d.values.length
  const firstValue = d.values[0]
  if (len === 0 || firstValue === undefined) return { cumVal: 0, maxDrawdown: 0 }

  let peak = firstValue
  let maxDrawdown = 0
  for (let i = 1; i < len; i++) {
    const currentValue = d.values[i]
    if (currentValue === undefined) {
      continue
    }

    if (currentValue > peak) {
      peak = currentValue
    } else {
      const drawdown = peak - currentValue
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
  }

  return {
    cumVal: d.values[len - 1] ?? 0,
    maxDrawdown: -Math.round(maxDrawdown * 100) / 100,
  }
})

const dateRange = computed(() => {
  const times = chartData.value.times
  const firstTime = times[0]
  const lastTime = times[times.length - 1]
  if (!firstTime || !lastTime) return ''
  return `${firstTime} ~ ${lastTime}`
})

function onRangeSelect(index: number) {
  rangeIndex.value = index
  const selected = rangeOptions[index]
  if (selected) {
    range.value = selected.value
  }
}

function getRangeStart(rangeKey: string, anchorTime?: string): Date | null {
  if (rangeKey === 'all') return null
  const anchorDate = anchorTime ? new Date(anchorTime) : new Date()
  if (Number.isNaN(anchorDate.getTime())) {
    return null
  }

  const map: Record<string, number> = { '1m': 1, '3m': 3, '1y': 12, '3y': 36 }
  const months = map[rangeKey]
  if (!months) return null
  const d = new Date(anchorDate)
  d.setMonth(d.getMonth() - months)
  return d
}

function buildReturnData(): { times: string[]; values: number[]; dailyValues: number[] } {
  if (props.equityCurve.length === 0) return { times: [], values: [], dailyValues: [] }

  // Use backend equity curve data directly
  const latestPointTime = props.equityCurve[props.equityCurve.length - 1]?.time
  const rangeStart = getRangeStart(range.value, latestPointTime)

  let filtered = props.equityCurve
  if (rangeStart) {
    filtered = props.equityCurve.filter((p) => new Date(p.time) >= rangeStart!)
  }

  if (filtered.length === 0) return { times: [], values: [], dailyValues: [] }

  const times = filtered.map((p) => p.time)
  const values = filtered.map((p) => Math.round(p.returnRate * 10000) / 100)
  const dailyValues: number[] = []
  for (let i = 0; i < filtered.length; i++) {
    if (i === 0) {
      dailyValues.push(0)
    } else {
      const previousPoint = filtered[i - 1]
      const currentPoint = filtered[i]
      if (!previousPoint || !currentPoint || previousPoint.equity === 0) {
        dailyValues.push(0)
        continue
      }

      const prev = previousPoint.equity
      const cur = currentPoint.equity
      dailyValues.push(Math.round(((cur - prev) / prev) * 10000) / 100)
    }
  }

  return { times, values, dailyValues }
}

function getChartOption(times: string[], values: number[]) {
  return {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        const idx = p.dataIndex
        const d = chartData.value
        const cumVal = d.values[idx] ?? 0
        const dailyVal = d.dailyValues[idx] ?? 0
        const cumColor = cumVal > 0 ? '#e74c3c' : cumVal < 0 ? '#22c55e' : '#999'
        const dailyColor = dailyVal > 0 ? '#e74c3c' : dailyVal < 0 ? '#22c55e' : '#999'
        const cumSign = cumVal > 0 ? '+' : ''
        const dailySign = dailyVal > 0 ? '+' : ''
        return `${p.axisValue}<br/>
          累计收益率：<span style="color:${cumColor};font-weight:600">${cumSign}${cumVal}%</span><br/>
          当日收益率：<span style="color:${dailyColor};font-weight:600">${dailySign}${dailyVal}%</span>`
      },
    },
    grid: {
      left: 50,
      right: 16,
      top: 16,
      bottom: 24,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: {
        color: '#999',
        fontSize: 10,
        formatter: (val: string) => val.slice(5),
      },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 10,
        formatter: (v: number) => v.toFixed(1) + '%',
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#1677ff', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(22, 119, 255, 0.2)' },
            { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
          ]),
        },
      },
    ],
  }
}

function initChart() {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)

  chartData.value = buildReturnData()
  const { times, values } = chartData.value

  chart.setOption(getChartOption(times, values))
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(
  () => [props.equityCurve, props.initialCapital, range.value],
  () => {
    if (chart) {
      chartData.value = buildReturnData()
      const { times, values } = chartData.value
      chart.clear()
      chart.setOption(getChartOption(times, values))
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="equity-section">
    <h3 class="section-title">收益率曲线</h3>
    <div class="range-tabs">
      <button
        v-for="(opt, index) in rangeOptions"
        :key="opt.value"
        :class="['range-tab', { active: rangeIndex === index }]"
        @click="onRangeSelect(index)"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">累计收益率</span>
        <span class="summary-value" :class="{ up: lastReturn.cumVal > 0, down: lastReturn.cumVal < 0 }">
          {{ lastReturn.cumVal > 0 ? '+' : '' }}{{ lastReturn.cumVal }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">最大回撤</span>
        <span class="summary-value down">{{ lastReturn.maxDrawdown }}%</span>
      </div>
    </div>
    <div class="date-range">{{ dateRange }}</div>
    <div ref="chartContainer" class="chart-container" />
  </div>
</template>

<style scoped>
.equity-section {
  padding: 12px 16px;
  margin-top: 12px;
  background: #fff;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.date-range {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 12px;
}

.range-tabs {
  display: flex;
  gap: 4px;
  border: none;
  background: none;
  padding: 0;
  margin-bottom: 8px;
}

.range-tab {
  border: none;
  color: #999;
  font-size: 12px;
  padding: 0 8px;
  height: 28px;
  line-height: 28px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.range-tab.active {
  color: #333;
  font-weight: 500;
  background: #e6f4ff;
  color: #1677ff;
}

.summary-row {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.summary-label {
  font-size: 13px;
  color: #333;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.summary-value.up {
  color: #e74c3c;
}

.summary-value.down {
  color: #22c55e;
}

.chart-container {
  height: 240px;
}
</style>
