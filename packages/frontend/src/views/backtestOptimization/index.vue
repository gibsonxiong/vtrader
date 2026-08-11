<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs, { type Dayjs } from 'dayjs'
import { showToast } from '@/ui/mobile'
import { strategyApi, backtestingApi } from '@vtrader/backend/api'
import type { Interval } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'
import NavBar from '@/components/NavBar.vue'
import NumberInput from '@/components/NumberInput.vue'
import PickerInput from '@/components/PickerInput.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import Button from '@/components/Button.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

interface HyperParam {
  name: string
  min: number
  max: number
  step: number
}

interface StrategyMeta {
  name: string
  label: string
  params: Record<string, { label: string; default: unknown; type: string }>
}

interface TrialRow {
  id: number
  params: string
  score: number
}

const router = useRouter()
const contractStore = useContractStore()

const strategies = ref<StrategyMeta[]>([])
const symbols = ref<{ brokerType: string; symbol: string; label: string }[]>([])

const intervalOptions = [
  { text: '1 分钟', value: '1m' },
  { text: '5 分钟', value: '5m' },
  { text: '15 分钟', value: '15m' },
  { text: '1 小时', value: '1h' },
  { text: '4 小时', value: '4h' },
  { text: '1 天', value: '1d' },
]

const targetMetricOptions = [
  { text: '总收益率', value: 'totalReturnPercent' },
  { text: '夏普比率', value: 'sharpeRatio' },
  { text: '胜率', value: 'winRate' },
  { text: '盈亏比', value: 'profitFactor' },
  { text: '年化收益率', value: 'annualizedReturn' },
  { text: '最大回撤', value: 'maxDrawdownPercent' },
  { text: '最大连亏天数', value: 'maxConsecutiveLosses' },
]

const directionOptions = [
  { text: '最大化', value: 'maximize' },
  { text: '最小化', value: 'minimize' },
]

const form = reactive({
  strategyName: '',
  symbol: '',
  interval: '1h' as string,
  startDate: dayjs('2025-01-01') as Dayjs | null,
  endDate: dayjs('2025-01-01') as Dayjs | null,
  assetBalance: 100_000,
  hyperparams: [] as HyperParam[],
  maxTrials: 100,
  direction: 'maximize' as 'maximize' | 'minimize',
  targetMetric: 'totalReturnPercent' as string,
})

const submitting = ref(false)
const loading = ref(false)
const currentStrategyMeta = ref<StrategyMeta | null>(null)
const jobId = ref('')
const progress = ref(0)
const status = ref('')
const trials = ref<TrialRow[]>([])
const bestTrial = ref<TrialRow | null>(null)
const error = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const strategyData = computed(() => strategies.value.map((s) => ({ text: s.label, value: s.name })))
const symbolData = computed(() => symbols.value.map((s) => ({ text: s.label, value: s.symbol })))

const estimatedTrials = computed(() => {
  return form.hyperparams.reduce((acc, p) => {
    const n = Math.floor((p.max - p.min) / p.step) + 1
    return acc * Math.max(n, 1)
  }, 1)
})

function formatPercent(v: number): string {
  return (v * 100).toFixed(2) + '%'
}

function formatNum(v: number): string {
  return v.toFixed(4)
}

function formatScore(v: number, metric: string): string {
  if (['totalReturnPercent', 'winRate', 'annualizedReturn', 'maxDrawdownPercent'].includes(metric)) {
    return formatPercent(v)
  }
  return formatNum(v)
}

async function loadContracts(): Promise<void> {
  const contracts = await contractStore.fetchContracts('BINANCE_LINEAR')
  symbols.value = contracts.map((c) => ({
    brokerType: 'BINANCE_LINEAR',
    symbol: c.symbol.split(':')[0] + ':USDT',
    label: c.symbol.split(':')[0] + ':USDT',
  }))
}

onMounted(async () => {
  loading.value = true
  try {
    const [classRes] = await Promise.all([
      strategyApi.getStrategyClasses(),
      loadContracts(),
    ])
    const names: string[] = classRes.data ?? []
    strategies.value = names.map((name) => ({ name, label: name, params: {} }))
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function loadStrategyParams(name: string): Promise<void> {
  const detailRes = await strategyApi.getStrategyDetail({ name })
  const raw = detailRes.data ?? {} as Record<string, { value: unknown; type: string }>
  const params: Record<string, { label: string; default: unknown; type: string }> = {}
  for (const [key, entry] of Object.entries(raw)) {
    params[key] = { label: key, default: entry.value, type: entry.type }
  }
  currentStrategyMeta.value = { name, label: name, params }
  // 自动初始化数值型超参数
  form.hyperparams = Object.entries(params)
    .filter(([, v]) => v.type === 'number')
    .map(([key]) => ({ name: key, min: 10, max: 100, step: 5 }))
}

async function handleSubmit(): Promise<void> {
  if (!form.strategyName || !form.symbol || !form.startDate || !form.endDate) {
    showToast('请填写完整信息')
    return
  }
  if (form.hyperparams.length === 0) {
    showToast('没有可优化的数值型参数')
    return
  }

  submitting.value = true
  error.value = ''
  trials.value = []
  bestTrial.value = null
  progress.value = 0
  status.value = ''

  try {
    const res = await backtestingApi.optimization({
      brokerType: 'BINANCE_LINEAR',
      startDate: form.startDate.format('YYYY-MM-DD'),
      endDate: form.endDate.format('YYYY-MM-DD'),
      symbol: form.symbol,
      interval: form.interval as Interval,
      assetBalance: form.assetBalance,
      assetName: 'USDT',
      commissionRate: 0.0005,
      strategyName: form.strategyName,
      hyperparameters: form.hyperparams.map((p) => ({
        name: p.name,
        type: 'continuous' as const,
        range: [p.min, p.max, p.step] as number[],
      })),
      maxTrials: form.maxTrials,
      direction: form.direction,
      targetMetric: form.targetMetric as typeof form.targetMetric,
    })

    jobId.value = res.data?.jobId ?? ''
    status.value = 'running'

    pollTimer = setInterval(pollStatus, 2000)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '提交失败'
    error.value = msg
    showToast('提交失败')
    submitting.value = false
  }
}

async function pollStatus(): Promise<void> {
  if (!jobId.value) return
  try {
    const res = await backtestingApi.jobStatus({ jobId: jobId.value })
    const s = res.data
    status.value = s.status
    progress.value = s.progress ?? progress.value

    if (s.status === 'completed' && s.data?.trials) {
      trials.value = s.data.trials.map((t: { id: number; hyperparameters: Record<string, unknown>; score: number }) => ({
        id: t.id,
        params: JSON.stringify(t.hyperparameters),
        score: t.score,
      }))
      if (trials.value.length > 0) {
        bestTrial.value = form.direction === 'maximize'
          ? trials.value.reduce((a, b) => a.score > b.score ? a : b)
          : trials.value.reduce((a, b) => a.score < b.score ? a : b)
      }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      submitting.value = false
    } else if (s.status === 'failed') {
      error.value = s.failedReason ?? '优化失败'
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      submitting.value = false
    }
  } catch {
    // 忽略轮询错误
  }
}

function removeParam(index: number): void {
  form.hyperparams.splice(index, 1)
}
</script>

<template>
  <div class="page">
    <NavBar title="参数优化" />

    <div class="form-container">
      <CellGroup bordered>
        <Cell title="策略">
          <PickerInput v-model="form.strategyName" :data="strategyData" title="选择策略" placeholder="请选择策略"
            @update:model-value="loadStrategyParams" />
        </Cell>
        <Cell title="交易对">
          <PickerInput v-model="form.symbol" :data="symbolData" title="选择交易对" placeholder="请选择交易对" />
        </Cell>
        <Cell title="周期">
          <PickerInput v-model="form.interval" :data="intervalOptions" title="选择周期" placeholder="请选择周期" />
        </Cell>
        <Cell title="开始日期">
          <DatePickerInput v-model="form.startDate" title="选择开始日期" placeholder="请选择开始日期" />
        </Cell>
        <Cell title="结束日期">
          <DatePickerInput v-model="form.endDate" title="选择结束日期" placeholder="请选择结束日期" />
        </Cell>
        <Cell title="初始资金 (USDT)">
          <NumberInput v-model="form.assetBalance" placeholder="请输入初始资金" />
        </Cell>
      </CellGroup>

      <!-- 超参数配置 -->
      <div v-if="form.hyperparams.length > 0" class="section">
        <div class="section-title">超参数范围</div>
        <CellGroup bordered>
          <Cell v-for="(p, i) in form.hyperparams" :key="p.name" :title="p.name">
            <span class="param-row">
              <input v-model.number="p.min" class="param-input" type="number" />
              <span>~</span>
              <input v-model.number="p.max" class="param-input" type="number" />
              <span>步</span>
              <input v-model.number="p.step" class="param-input param-input--small" type="number" />
              <span class="remove-btn" @click="removeParam(i)">✕</span>
            </span>
          </Cell>
        </CellGroup>
        <div class="trial-info">
          预计 trials: {{ estimatedTrials }}
          <span v-if="estimatedTrials > form.maxTrials" style="color:#ff5722"> (超出上限)</span>
        </div>
      </div>

      <!-- 优化目标 -->
      <div class="section">
        <div class="section-title">优化目标</div>
        <CellGroup bordered>
          <Cell title="目标指标">
            <PickerInput v-model="form.targetMetric" :data="targetMetricOptions" title="选择目标指标" />
          </Cell>
          <Cell title="方向">
            <PickerInput v-model="form.direction" :data="directionOptions" title="选择方向" />
          </Cell>
          <Cell title="最大 trials">
            <input v-model.number="form.maxTrials" class="param-input" type="number" placeholder="100" />
          </Cell>
        </CellGroup>
      </div>

      <Button :loading="submitting" :mt="24" @click="handleSubmit"
        :disabled="form.hyperparams.length === 0 || !form.strategyName">
        {{ submitting ? `优化中 ${progress}%` : '开始优化' }}
      </Button>

      <!-- 进度条 -->
      <div v-if="status === 'running'" class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <p v-if="status === 'running'" class="status-text">优化进行中... {{ progress }}%</p>
      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- 最优结果 -->
      <div v-if="bestTrial" class="section">
        <div class="section-title">最优参数</div>
        <CellGroup bordered>
          <Cell title="参数">{{ bestTrial.params }}</Cell>
          <Cell title="得分">{{ formatScore(bestTrial.score, form.targetMetric) }}</Cell>
        </CellGroup>
      </div>

      <!-- Trial 列表 -->
      <div v-if="trials.length > 0" class="section">
        <div class="section-title">所有 Trials ({{ trials.length }})</div>
        <div class="trial-list">
          <div v-for="t in trials" :key="t.id" class="trial-item"
            :class="{ best: bestTrial && t.id === bestTrial.id }">
            <span class="trial-id">#{{ t.id }}</span>
            <span class="trial-params">{{ t.params }}</span>
            <span class="trial-score">{{ formatScore(t.score, form.targetMetric) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.form-container {
  padding: 12px 16px;
}

.section {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  padding-left: 4px;
}

.param-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.param-row span {
  color: #999;
  font-size: 13px;
}

.param-input {
  width: 64px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  outline: none;
}

.param-input--small {
  width: 52px;
}

.param-input:focus {
  border-color: #1890ff;
}

.remove-btn {
  cursor: pointer;
  color: #ff5252;
  font-size: 16px;
  margin-left: 4px;
}

.trial-info {
  margin-top: 8px;
  font-size: 13px;
  color: #999;
  text-align: right;
}

.progress-bar-wrap {
  margin-top: 12px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #1890ff;
  transition: width 0.3s;
}

.status-text {
  text-align: center;
  color: #1890ff;
  font-size: 13px;
  margin-top: 6px;
}

.error-text {
  text-align: center;
  color: #ff5252;
  font-size: 13px;
  margin-top: 6px;
}

.trial-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.trial-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.trial-item.best {
  background: #e6f7ff;
}

.trial-id {
  color: #999;
  width: 32px;
  flex-shrink: 0;
}

.trial-params {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
}

.trial-score {
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
