<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { showToast } from '@/ui/mobile'
import { backtestingApi, marketDataApi } from '@vtrader/backend/api'
import type { BarData, Backtesting, Interval } from '@vtrader/backend/api'
import EquityCurve from './components/EquityCurve.vue'
import TradeList from './components/TradeList.vue'
import KLineChart from './components/KLineChart.vue'

interface TradeRecord { time: string; price: number; amount: number; profit: number; type: 'buy' | 'sell' }
interface EquityCurvePoint { time: string; equity: number; returnRate: number }
interface BacktestMetrics { totalReturn: number; annualReturn: number; maxDrawdown: number; sharpeRatio: number; winRate: number; profitLossRatio: number; totalTrades: number; avgDailyTrades: number }
interface BacktestDetail { id: number; strategy: string; symbol: string; startDate: string; endDate: string; initialCapital: number; finalCapital: number; params: Record<string, number>; metrics: BacktestMetrics; trades: TradeRecord[]; kLines: BarData[]; equityCurve: EquityCurvePoint[] }

function toNumber(value: any): number {
  return Number(value ?? 0)
}

function toTradeRecords(trades: any[]): TradeRecord[] {
  let lastOpenPrice = 0
  return (trades ?? []).map((trade) => {
    const type = trade.offset === 'open' ? 'buy' : 'sell'
    const price = toNumber(trade.price)
    const amount = toNumber(trade.volume)
    let profit = 0
    if (trade.offset === 'open') {
      lastOpenPrice = price
    } else {
      profit = (price - lastOpenPrice) * amount
    }
    return { time: new Date(trade.time).toISOString(), price, amount, profit, type }
  })
}

function toEquityCurve(dailyResults: any[], initialCapital: number): EquityCurvePoint[] {
  return (dailyResults ?? []).map((item) => {
    const equity = initialCapital + toNumber(item.accumNetPnl)
    return { time: item.date, equity, returnRate: initialCapital === 0 ? 0 : (equity - initialCapital) / initialCapital }
  })
}

async function getBacktestDetail(id: number): Promise<BacktestDetail> {
  const detailRes = await backtestingApi.query({ id })
  const model = detailRes.data?.model as Backtesting
  if (!model) throw new Error('回测记录不存在')

  const initialCapital = toNumber(model.startBalance)
  const finalCapital = toNumber(model.endBalance)
  const trades = toTradeRecords((model.trades ?? []) as any[])
  const equityCurve = toEquityCurve((model.dailyResults ?? []) as any[], initialCapital)

  const barRes = await marketDataApi.getBars({
    brokerType: model.brokerId as any,
    symbol: model.symbol,
    interval: model.interval as Interval,
    startDate: model.startDate,
    endDate: model.endDate,
    source: 'db', currentPage: 1, pageSize: 1000,
  })

  const totalTrades = trades.length
  const positiveTrades = trades.filter(t => t.profit > 0)
  const negativeTrades = trades.filter(t => t.profit < 0)
  const avgProfit = positiveTrades.length ? positiveTrades.reduce((s, t) => s + t.profit, 0) / positiveTrades.length : 0
  const avgLoss = negativeTrades.length ? Math.abs(negativeTrades.reduce((s, t) => s + t.profit, 0) / negativeTrades.length) : 0
  const dayCount = Math.max(equityCurve.length, 1)

  return {
    id: model.id, 
    strategy: model.strategyName, 
    symbol: model.symbol,
    startDate: model.startDate, 
    endDate: model.endDate,
    initialCapital, 
    finalCapital, 
    params: {},
    metrics: {
      totalReturn: toNumber(model.totalReturnPercent),
      annualReturn: dayCount > 0 ? toNumber(model.totalReturnPercent) * (365 / dayCount) : 0,
      maxDrawdown: toNumber(model.maxDrawdownPercent), sharpeRatio: 0,
      winRate: totalTrades === 0 ? 0 : positiveTrades.length / totalTrades,
      profitLossRatio: avgLoss === 0 ? 9999 : avgProfit / avgLoss,
      totalTrades, avgDailyTrades: totalTrades / dayCount,
    },
    trades, 
    kLines: barRes.data?.list || [], 
    equityCurve,
  }
}

const route = useRoute()
const router = useRouter()
const detail = ref<BacktestDetail | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    showToast('参数错误')
    router.back()
    return
  }
  try {
    detail.value = await getBacktestDetail(id)
  } catch {
    // toast 已在拦截器中处理
  } finally {
    loading.value = false
  }
})

function formatPercent(val: number): string {
  return (val >= 0 ? '+' : '') + (val * 100).toFixed(2) + '%'
}
</script>

<template>
  <div class="page detail-page">
    <div class="nav-bar">
      <button class="nav-back" @click="router.back()">← 返回</button>
      <span class="nav-title">回测详情</span>
      <span class="nav-right"></span>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>加载详情中...</span>
    </div>

    <template v-if="detail">
      <div class="section">
        <div class="card">
          <div class="card-header">
            <span class="strategy">{{ detail.strategy }}</span>
            <m-tag color="primary" fill="outline">{{ detail.symbol }}</m-tag>
          </div>

          <div class="cell-group">
            <div class="cell">
              <span class="cell-title">日期范围</span>
              <span class="cell-value">{{ dayjs(detail.startDate).format('YYYY-MM-DD') + ' ~ ' + dayjs(detail.endDate).format('YYYY-MM-DD') }}</span>
            </div>
            <div class="cell">
              <span class="cell-title">初始资金</span>
              <span class="cell-value">{{ detail.initialCapital.toLocaleString() + ' USDT' }}</span>
            </div>
            <div class="cell">
              <span class="cell-title">最终资金</span>
              <span class="cell-value">{{ detail.finalCapital.toLocaleString() + ' USDT' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 策略参数 -->
      <div class="section" v-if="Object.keys(detail.params).length > 0">
        <div class="card">
          <div class="card-header">
            <span class="strategy">策略参数</span>
          </div>
          <div class="cell-group">
            <div class="cell" v-for="(val, key) in detail.params" :key="key">
              <span class="cell-title">{{ key }}</span>
              <span class="cell-value">{{ String(val) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 绩效指标 -->
      <div class="section" v-if="detail.metrics">
        <div class="card">
          <div class="card-header">
            <span class="strategy">绩效指标</span>
          </div>
          <div class="cell-group">
            <div class="cell">
              <span class="cell-title">总收益率</span>
              <span class="cell-value"><span v-number-color="detail.metrics.totalReturn">{{ formatPercent(detail.metrics.totalReturn) }}</span></span>
            </div>
            <div class="cell">
              <span class="cell-title">年化收益率</span>
              <span class="cell-value"><span v-number-color="detail.metrics.annualReturn">{{ formatPercent(detail.metrics.annualReturn) }}</span></span>
            </div>
            <div class="cell">
              <span class="cell-title">最大回撤</span>
              <span class="cell-value"><span style="color:#22c55e;font-weight:600">{{ (detail.metrics.maxDrawdown * 100).toFixed(2) }}%</span></span>
            </div>
            <div class="cell">
              <span class="cell-title">夏普比率</span>
              <span class="cell-value">{{ detail.metrics.sharpeRatio.toFixed(2) }}</span>
            </div>
            <div class="cell">
              <span class="cell-title">胜率</span>
              <span class="cell-value"><span v-number-color="detail.metrics.winRate - 0.5">{{ (detail.metrics.winRate * 100).toFixed(1) }}%</span></span>
            </div>
            <div class="cell">
              <span class="cell-title">盈亏比</span>
              <span class="cell-value">{{ detail.metrics.profitLossRatio === 9999 ? '∞' : detail.metrics.profitLossRatio.toFixed(2) }}</span>
            </div>
            <div class="cell">
              <span class="cell-title">总交易次数</span>
              <span class="cell-value">{{ detail.metrics.totalTrades }}</span>
            </div>
            <div class="cell">
              <span class="cell-title">日均交易次数</span>
              <span class="cell-value">{{ detail.metrics.avgDailyTrades }}</span>
            </div>
          </div>
        </div>
      </div>

      <EquityCurve :equity-curve="detail.equityCurve" :initial-capital="detail.initialCapital" />

      <KLineChart :k-lines="detail.kLines" :trades="detail.trades" />

      <TradeList :trades="detail.trades" />
    </template>

    <div v-else-if="!loading" class="empty-state">
      <p>未获取到回测详情</p>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.nav-back {
  background: none;
  border: none;
  font-size: 14px;
  color: #1677ff;
  cursor: pointer;
  padding: 0;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 50px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 8px;
  color: #999;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #eee;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.section {
  padding: 12px 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 0;
}

.strategy {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.cell-group {
  padding: 8px 16px;
}

.cell {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.cell-title {
  color: #666;
}

.cell-value {
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #999;
}
</style>
