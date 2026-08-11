<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { showToast } from '@/ui/mobile'
import { backtestingApi, marketDataApi } from '@vtrader/backend/api'
import NavBar from '@/components/NavBar.vue'
import type { BarData, Interval, BacktestingModel } from '@vtrader/backend/api'
import EquityCurve from './components/EquityCurve.vue'
import TradeList from './components/TradeList.vue'
import KLineChart from './components/KLineChart.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

export interface TradeRecord { time: string; price: number; amount: number; profit: number; type: 'buy' | 'sell' }
export interface EquityCurvePoint { time: string; equity: number; returnRate: number }

function toNumber(value: unknown): number {
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

function toEquityCurve(dailyResults: any[], startBalance: number): EquityCurvePoint[] {
  return (dailyResults ?? []).map((item) => {
    const equity = startBalance + toNumber(item.accumNetPnl)
    return { time: item.date, equity, returnRate: startBalance === 0 ? 0 : (equity - startBalance) / startBalance }
  })
}

const route = useRoute()
const router = useRouter()

const model = ref<BacktestingModel | null>(null)
const startBalance = computed(() => toNumber(model.value?.startBalance))
const endBalance = computed(() => toNumber(model.value?.endBalance))
const trades = ref<TradeRecord[]>([])
const kLines = ref<BarData[]>([])
const equityCurve = ref<EquityCurvePoint[]>([])
const metrics = ref({ totalReturn: 0, annualReturn: 0, maxDrawdown: 0, sharpeRatio: 0, winRate: 0, profitLossRatio: 0, totalTrades: 0, avgDailyTrades: 0, maxConsecutiveLosses: 0 })
const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    showToast('参数错误')
    router.back()
    return
  }
  try {
    const detailRes = await backtestingApi.query({ id })
    const m = detailRes.data?.model as BacktestingModel
    if (!m) throw new Error('回测记录不存在')

    model.value = m
    trades.value = toTradeRecords((m.trades ?? []) as any[])
    equityCurve.value = toEquityCurve((m.dailyResults ?? []) as any[], startBalance.value)

    const barRes = await marketDataApi.getBars({
      brokerType: m.brokerId as any,
      symbol: m.symbol,
      interval: m.interval as Interval,
      startDate: m.startDate,
      endDate: m.endDate,
      source: 'db', currentPage: 1, pageSize: 1000,
    })
    kLines.value = barRes.data?.list || []

    const t = trades.value
    const dayCount = Math.max(equityCurve.value.length, 1)

    // 优先使用后端计算的指标，旧记录回退到本地计算
    const mtr = m.metrics
    metrics.value = {
      totalReturn: mtr?.totalReturnPercent ?? toNumber(m.totalReturnPercent),
      maxDrawdown: mtr?.maxDrawdownPercent ?? toNumber(m.maxDrawdownPercent),
      totalTrades: t.length,
      avgDailyTrades: t.length / dayCount,
      // 后端计算（新记录）
      annualReturn: mtr?.annualizedReturn ?? (dayCount > 0 ? toNumber(m.totalReturnPercent) * (365 / dayCount) : 0),
      sharpeRatio: mtr?.sharpeRatio ?? 0,
      winRate: mtr?.winRate ?? (t.length === 0 ? 0 : t.filter(x => x.profit > 0).length / t.length),
      profitLossRatio: mtr?.profitFactor ?? (() => {
        const pos = t.filter(x => x.profit > 0)
        const neg = t.filter(x => x.profit < 0)
        const avgP = pos.length ? pos.reduce((s, x) => s + x.profit, 0) / pos.length : 0
        const avgL = neg.length ? Math.abs(neg.reduce((s, x) => s + x.profit, 0) / neg.length) : 0
        return avgL === 0 ? 9999 : avgP / avgL
      })(),
      maxConsecutiveLosses: mtr?.maxConsecutiveLosses ?? 0,
    }
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
    <NavBar title="回测详情" />

    <LoadingSpinner v-if="loading" />

    <template v-if="model">
      <div class="section">
        <div class="card">
          <div class="card-header">
            <span class="strategy">{{ model.strategyName }}</span>
            <m-tag color="primary" fill="outline">{{ model.symbol }}</m-tag>
          </div>

          <CellGroup>
            <Cell title="日期范围">{{ dayjs(model.startDate).format('YYYY-MM-DD') + ' ~ ' + dayjs(model.endDate).format('YYYY-MM-DD') }}</Cell>
            <Cell title="初始资金">{{ startBalance.toLocaleString() + ' USDT' }}</Cell>
            <Cell title="最终资金">{{ endBalance.toLocaleString() + ' USDT' }}</Cell>
          </CellGroup>
        </div>
      </div>

      <!-- 绩效指标 -->
      <div class="section">
        <div class="card">
          <div class="card-header">
            <span class="strategy">绩效指标</span>
          </div>
          <CellGroup>
            <Cell title="总收益率">
              <span v-number-color="metrics.totalReturn">{{ formatPercent(metrics.totalReturn) }}</span>
            </Cell>
            <Cell title="年化收益率">
              <span v-number-color="metrics.annualReturn">{{ formatPercent(metrics.annualReturn) }}</span>
            </Cell>
            <Cell title="最大回撤">
              <span style="color:#22c55e;font-weight:600">{{ (metrics.maxDrawdown * 100).toFixed(2) }}%</span>
            </Cell>
            <Cell title="夏普比率">{{ metrics.sharpeRatio.toFixed(2) }}</Cell>
            <Cell title="胜率">
              <span v-number-color="metrics.winRate - 0.5">{{ (metrics.winRate * 100).toFixed(1) }}%</span>
            </Cell>
            <Cell title="盈亏比">{{ metrics.profitLossRatio === 9999 ? '∞' : metrics.profitLossRatio.toFixed(2) }}</Cell>
            <Cell title="最大连亏天数">{{ metrics.maxConsecutiveLosses }}</Cell>
            <Cell title="总交易次数">{{ metrics.totalTrades }}</Cell>
            <Cell title="日均交易次数">{{ metrics.avgDailyTrades }}</Cell>
          </CellGroup>
        </div>
      </div>

      <EquityCurve :equity-curve="equityCurve" :initial-capital="startBalance" />

      <KLineChart :k-lines="kLines" :trades="trades" />

      <TradeList :trades="trades" />
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

.detail-page {
  padding-bottom: 20px;
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



.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #999;
}
</style>
