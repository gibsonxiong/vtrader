<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { init, dispose, registerOverlay } from 'klinecharts'
import type { BarData, Interval } from '@vtrader/backend/api'
import type { TradeRecord } from '../index.vue'

// 买卖点 tooltip 状态
const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  tradeIndex: 0,
  data: null as TradeRecord | null,
})

// chart 容器引用，用于将 canvas 坐标转为 viewport 坐标
const chartContainer = ref<HTMLElement | null>(null)

function hideTooltip() {
  tooltip.show = false
  tooltip.data = null
}

// 点击 tooltip 外部时关闭（tooltip 内部有 @click.stop 阻止冒泡）
function onDocClick() {
  if (tooltip.show) {
    hideTooltip()
  }
}

// tooltip 位置样式，自动检测视口溢出并翻转方向
const tooltipStyle = computed(() => {
  if (!tooltip.show) return {}
  const tooltipWidth = 170
  const tooltipHeight = 120
  const gap = 14
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  // 水平方向：默认在标记右侧，溢出则翻到左侧
  const leftNormal = tooltip.x + gap
  const overflowRight = leftNormal + tooltipWidth > viewportW
  const left = overflowRight ? tooltip.x - tooltipWidth - gap : leftNormal

  // 垂直方向：相对于标记居中，并限制不超出视口
  const top = Math.max(4, Math.min(tooltip.y - tooltipHeight / 2, viewportH - tooltipHeight - 4))

  return { left: left + 'px', top: top + 'px' }
})

// 注册买卖点标记 overlay（只需注册一次）
registerOverlay({
  name: 'TradeMarkers',
  totalStep: 0,
  lock: true,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const markers = overlay.extendData as Array<{
      type: 'buy' | 'sell'
      price: number
      amount: number
      profit: number
    }>
    if (!markers || !coordinates) return []

    return markers.flatMap((m, i) => {
      const coord = coordinates[i]
      if (!coord) return []
      const isBuy = m.type === 'buy'
      const size = 9
      const x = coord.x
      const y = coord.y
      const color = isBuy ? '#e74c3c' : '#22c55e'

      // 买入：价格点在上 → 向下 20px 虚线 → 末端接上三角
      // 卖出：价格点在下 → 向上 20px 虚线 → 末端接下三角
      const lineEndY = isBuy ? y + 20 : y - 20
      const triangleTipY = lineEndY
      const triangleBaseY = isBuy ? lineEndY + size : lineEndY - size

      const triangle = {
        type: 'polygon' as const,
        attrs: {
          coordinates: [
            { x, y: triangleTipY },
            { x: x - size * 0.7, y: triangleBaseY },
            { x: x + size * 0.7, y: triangleBaseY },
          ],
          _tradeIndex: i,
        },
        styles: { style: 'stroke_fill', color: color, borderColor: '#fff', borderSize: 1 },
      }

      // 连线：从价格位置到三角尖端
      const line = {
        type: 'line' as const,
        attrs: {
          coordinates: [
            { x, y },
            { x, y: triangleTipY },
          ],
          _tradeIndex: i,
        },
        styles: {
          style: 'dashed',
          color: 'rgba(0,0,0,0.15)',
          size: 1,
          dashValue: [3, 3],
        },
      }

      return [triangle, line]
    })
  },
  onClick: ({ overlay, figure }: any) => {
    const idx = figure?.attrs?._tradeIndex
    if (idx === undefined) return
    const trades = overlay.extendData as TradeRecord[]
    const selectedTrade = trades[idx]
    if (idx >= 0 && idx < trades.length && selectedTrade) {
      // 从 figure 的坐标（canvas 空间）计算 viewport 位置
      const coords = figure.attrs.coordinates as Array<{ x: number; y: number }>
      const rect = chartContainer.value?.getBoundingClientRect()
      const firstCoord = coords[0]
      if (coords && coords.length > 0 && firstCoord && rect) {
        // 取三角的顶部点（买入是第一个点，卖出是第二个点）
        const figX = firstCoord.x
        const figY = coords.reduce((min, p) => Math.min(min, p.y), Infinity)
        tooltip.x = rect.left + figX
        tooltip.y = rect.top + figY
      }
      tooltip.show = true
      tooltip.tradeIndex = idx
      tooltip.data = selectedTrade
    }
  },
})

const props = defineProps<{
  kLines: BarData[]
  trades?: TradeRecord[]
}>()

let chart: ReturnType<typeof init> | null = null

// 买卖点显示开关
const showTradeMarkers = ref(true)

function toggleTradeMarkers() {
  showTradeMarkers.value = !showTradeMarkers.value
  nextTick(initChart)
}

// 指标开关
const indicatorConfig = reactive({
  MA: { label: 'MA', enabled: true, isMain: true },
  EMA: { label: 'EMA', enabled: false, isMain: true },
  BOLL: { label: 'BOLL', enabled: false, isMain: true },
  VOL: { label: 'VOL', enabled: true, isMain: false },
  MACD: { label: 'MACD', enabled: false, isMain: false },
  KDJ: { label: 'KDJ', enabled: false, isMain: false },
  RSI: { label: 'RSI', enabled: false, isMain: false },
})

const indicatorPaneHeight: Record<string, number> = {
  VOL: 60,
  MACD: 60,
  KDJ: 60,
  RSI: 60,
}

const mainPaneHeight = 250

const containerHeight = computed(() => {
  let h = mainPaneHeight
  for (const [name, cfg] of Object.entries(indicatorConfig)) {
    if (cfg.enabled && !cfg.isMain) {
      h += indicatorPaneHeight[name] ?? 50
    }
  }
  return h + 'px'
})

function toggleIndicator(name: string) {
  const cfg = indicatorConfig[name as keyof typeof indicatorConfig]
  if (!cfg) return
  cfg.enabled = !cfg.enabled
  nextTick(initChart)
}

// 将后端 K 线周期映射为 klinecharts 的 Period，用于正确的坐标轴/tooltip 时间格式化
function intervalToPeriod(interval?: Interval): { type: 'minute' | 'hour' | 'day' | 'week' | 'month'; span: number } {
  if (!interval) return { type: 'day', span: 1 }
  const match = /^(\d+)([mhdwM])$/.exec(interval)
  if (!match) return { type: 'day', span: 1 }
  const span = Number(match[1])
  switch (match[2]) {
    case 'm': return { type: 'minute', span }
    case 'h': return { type: 'hour', span }
    case 'd': return { type: 'day', span }
    case 'w': return { type: 'week', span }
    case 'M': return { type: 'month', span }
    default: return { type: 'day', span: 1 }
  }
}

function getMainPaneId() {
  if (!chart) return undefined

  const paneOptions = chart.getPaneOptions()
  if (Array.isArray(paneOptions)) {
    return paneOptions[0]?.id
  }

  return paneOptions?.id
}

function initChart() {
  if (!chartContainer.value || props.kLines.length === 0) return

  dispose(chartContainer.value)
  chart = init(chartContainer.value, {
    layout: {
      basicParams: {
        yAxisInside: true,
      },
    },
  } as any)
  if (!chart) return

  const data = props.kLines.map((k) => ({
    timestamp: k.timestamp,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
  }))

  // klinecharts v10 uses DataLoader pattern
  chart.setDataLoader({
    getBars: (_params: any) => {
      _params.callback(data, { backward: false, forward: false })
    },
  })
  chart.setSymbol({ ticker: 'BTC/USDT', pricePrecision: 2, volumePrecision: 0 })
  chart.setPeriod(intervalToPeriod(props.kLines[0]?.interval))
  chart.setBarSpace(6)

  // 主图高度
  chart.setPaneOptions({ height: 200 })
  const mainPaneId = getMainPaneId()

  // 根据开关添加指标
  for (const [name, cfg] of Object.entries(indicatorConfig)) {
    if (cfg.enabled) {
      if (cfg.isMain) {
        chart.createIndicator({
          name,
          paneId: mainPaneId,
        }, true)
      } else {
        const paneId = chart.createIndicator(name, false)
        if (paneId) {
          chart.setPaneOptions({
            id: paneId,
            height: indicatorPaneHeight[name] ?? 50,
          })
        }
      }
    }
  }

  // 图表拖拽/缩放时关闭 tooltip
  chart.subscribeAction('onScroll', hideTooltip)
  chart.subscribeAction('onZoom', hideTooltip)
  chart.subscribeAction('onCrosshairChange', (hideTooltip))

  // 添加买卖点标记
  if (showTradeMarkers.value && props.trades && props.trades.length > 0) {
    const markers = props.trades.map((t) => ({
      timestamp: new Date(t.time).getTime(),
      value: t.price,
      type: t.type,
    }))

    chart.createOverlay({
      name: 'TradeMarkers',
      points: markers.map((m) => ({
        timestamp: m.timestamp,
        value: m.value,
      })),
      extendData: props.trades.map((t) => ({
        type: t.type,
        price: t.price,
        amount: t.amount,
        profit: t.profit,
      })),
    })
  }

  chart.setStyles({
    candle: {
      bar: {
        upColor: '#e74c3c',
        downColor: '#22c55e',
        noChangeColor: '#999',
        upBorderColor: '#e74c3c',
        downBorderColor: '#22c55e',
        noChangeBorderColor: '#999',
        upWickColor: '#e74c3c',
        downWickColor: '#22c55e',
        noChangeWickColor: '#999',
      },
      priceMark: {
        show: true,
        last: {
          upColor: '#e74c3c',
          downColor: '#22c55e',
          noChangeColor: '#999',
          text: { show: true, size: 10 },
        },
      },
      tooltip: {
        showRule: 'follow_cross',
        showType: 'rect',
        title: { size: 10 },
        legend: { size: 10 },
      },
    },
    indicator: {
      ohlc: {
        upColor: '#e74c3c',
        downColor: '#22c55e',
        noChangeColor: '#999',
      },
      bars: [
        {
          upColor: '#e74c3c',
          downColor: '#22c55e',
          noChangeColor: '#999',
        },
      ],
      tooltip: {
        title: { show: false },
        legend: { size: 10, marginTop: 2, marginLeft: 2 },
        offsetTop: 2,
        offsetLeft: 2,
      },
    },
    grid: {
      show: true,
      horizontal: {
        show: true,
        color: '#f0f0f0',
        size: 1,
      },
      vertical: {
        show: true,
        color: '#f0f0f0',
        size: 1,
      },
    },
    xAxis: {
      show: true,
      size: 'auto',
      axisLine: {
        show: true,
        color: '#eee',
      },
      tickLine: {
        show: false,
      },
      tickText: {
        size: 10,
        marginStart: 4,
        marginEnd: 4,
      },
    },
    yAxis: {
      show: true,
      size: 'auto',
      axisLine: {
        show: false,
      },
      tickLine: {
        show: false,
      },
      tickText: {
        size: 10,
        marginStart: 4,
        marginEnd: 4,
      },
    },
    separator: {
      size: 0,
      color: 'transparent',
      fill: false,
      activeBackgroundColor: 'transparent',
    },
    crosshair: {
      show: true,
      horizontal: {
        show: true,
        text: { show: true, size: 10 },
      },
      vertical: {
        show: true,
        text: { show: true, size: 10 },
      },
    },
  })
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', onDocClick)
  if (chartContainer.value) {
    dispose(chartContainer.value)
  }
})

watch(
  () => props.kLines,
  () => {
    nextTick(initChart)
  },
  { deep: true }
)
</script>

<template>
  <div class="kline-section">
    <div class="kline-header">
      <h3 class="section-title">K线图</h3>
    </div>
    <div
      ref="chartContainer"
      class="kline-container"
      :style="{ height: containerHeight }"
    />
    <!-- 买卖点 tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.show && tooltip.data"
        class="trade-tooltip"
        :style="tooltipStyle"
        @click.stop
      >
        <div class="tooltip-row">
          <span class="tooltip-label">序号</span>
          <span class="tooltip-value">#{{ tooltip.tradeIndex + 1 }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">类型</span>
          <span :class="['tooltip-value', tooltip.data.type === 'buy' ? 'color-buy' : 'color-sell']">
            {{ tooltip.data.type === 'buy' ? '买入' : '卖出' }}
          </span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">价格</span>
          <span class="tooltip-value">{{ tooltip.data.price.toFixed(2) }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">数量</span>
          <span class="tooltip-value">{{ tooltip.data.amount }}</span>
        </div>
        <div class="tooltip-row" v-if="tooltip.data.profit !== undefined">
          <span class="tooltip-label">盈亏</span>
          <span :class="['tooltip-value', tooltip.data.profit >= 0 ? 'color-profit' : 'color-loss']">
            {{ tooltip.data.profit >= 0 ? '+' : '' }}{{ tooltip.data.profit.toFixed(2) }}
          </span>
        </div>
        <div class="tooltip-close" @click="hideTooltip">×</div>
      </div>
    </Teleport>
    <div class="indicator-toolbar">
      <button
        :class="['indicator-btn', { active: showTradeMarkers }]"
        @click="toggleTradeMarkers"
      >
        买卖点
      </button>
      <button
        v-for="(cfg, name) in indicatorConfig"
        :key="name"
        :class="['indicator-btn', { active: cfg.enabled }]"
        @click="toggleIndicator(name)"
      >
        {{ cfg.label }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.kline-section {
  padding: @section-padding;
  margin-top: @section-margin-top;
  background: @bg-white;
  overflow: hidden;
}

.kline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: @title-margin-bottom;
}

.section-title {
  font-size: @font-size-title;
  font-weight: @font-weight-bold;
  color: @text-primary;
  margin: 0;
}

.indicator-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.indicator-btn {
  padding: 4px 8px;
  font-size: @font-size-small;
  background: none;
  color: @text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.6;
  border: none;

  &:hover {
    color: @text-secondary;
  }

  &.active {
    color: @text-primary;
  }
}
</style>

<!-- Teleport 到 body 的 tooltip 样式，不能用 scoped -->
<style lang="less">
.trade-tooltip {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 10px 14px;
  min-width: 140px;
  font-size: 12px;
  line-height: 1.6;
  pointer-events: auto;

  .tooltip-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    white-space: nowrap;
  }

  .tooltip-label {
    color: #999;
  }

  .tooltip-value {
    font-weight: 600;
    color: #333;
  }

  .color-buy { color: #e74c3c; }
  .color-sell { color: #22c55e; }
  .color-profit { color: #22c55e; }
  .color-loss { color: #e74c3c; }

  .tooltip-close {
    position: absolute;
    top: 2px;
    right: 6px;
    cursor: pointer;
    color: #ccc;
    font-size: 14px;
    line-height: 1;

    &:hover {
      color: #666;
    }
  }
}
</style>
