<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/ui/mobile'
import { strategyApi, brokerConfigApi, backtestingApi } from '@vtrader/backend/api'
import type { BrokerConfig, ContractData } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'
import StrategyParams from './components/StrategyParams.vue'

interface StrategyParamMeta { label: string; default: any; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

interface BacktestConfig {
  strategy: string
  symbol: string
  brokerType: string
  startDate: string
  endDate: string
  initialCapital: number
  interval: string
  params: Record<string, any>
}

interface SymbolOption {
  brokerType: string
  symbol: string
  label: string
}

const router = useRouter()
const contractStore = useContractStore()

const strategies = ref<StrategyMeta[]>([])
const symbols = ref<SymbolOption[]>([])
const loadingStrategies = ref(false)
const loadingSymbols = ref(false)
const submitting = ref(false)

const intervals = [
  { text: '1 分钟', value: '1m' },
  { text: '5 分钟', value: '5m' },
  { text: '15 分钟', value: '15m' },
  { text: '30 分钟', value: '30m' },
  { text: '1 小时', value: '1h' },
  { text: '4 小时', value: '4h' },
  { text: '1 天', value: '1d' },
]

function getDefaultSymbol() {
  return symbols.value[0]?.symbol ?? ''
}

function getDefaultBrokerType() {
  return symbols.value[0]?.brokerType ?? ''
}

function getDefaultForm(): BacktestConfig {
  const firstStrategy = strategies.value[0]
  return {
    strategy: firstStrategy?.name ?? '',
    symbol: getDefaultSymbol(),
    brokerType: getDefaultBrokerType(),
    startDate: '2025-01-01',
    endDate: '2025-05-01',
    initialCapital: 10000,
    interval: '1m',
    params: firstStrategy ? buildStrategyParams(firstStrategy) : {},
  }
}

const form = reactive<BacktestConfig>(getDefaultForm())

const currentStrategyMeta = ref<StrategyMeta | null>(null)

function buildStrategyParams(meta: StrategyMeta): Record<string, any> {
  const defaults: Record<string, any> = {}
  for (const [key, paramMeta] of Object.entries(meta.params)) {
    defaults[key] = paramMeta.default
  }
  return defaults
}

watch(() => form.strategy, (name) => {
  currentStrategyMeta.value = strategies.value.find((s) => s.name === name) ?? null
  if (currentStrategyMeta.value) {
    form.params = buildStrategyParams(currentStrategyMeta.value)
  }
})

const showStrategyPicker = ref(false)
const strategyData = computed(() => strategies.value.map((s) => ({ label: s.label, value: s.name })))

const showSymbolPicker = ref(false)
const symbolData = computed(() => symbols.value.map((item) => ({ label: item.label, value: item.symbol })))

const showIntervalPicker = ref(false)
const intervalData = intervals.map(i => ({ label: i.text, value: i.value }))

const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

const showParamsPopup = ref(false)

function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateValue(dateStr: string): Date {
  return new Date(dateStr)
}

async function loadContracts() {
  const brokerRes = await brokerConfigApi.list()
  const brokers = (brokerRes.data ?? []).sort((a: BrokerConfig, b: BrokerConfig) => {
    const aIsTestnet = a.brokerType.includes('TESTNET')
    const bIsTestnet = b.brokerType.includes('TESTNET')
    return Number(aIsTestnet) - Number(bIsTestnet)
  })

  for (const broker of brokers) {
    const contracts = await contractStore.fetchContracts(broker.brokerType as any)
    if (contracts.length > 0) {
      return contracts.map((c: ContractData) => ({
        brokerType: broker.brokerType,
        symbol: c.symbol,
        label: c.symbol,
      }))
    }
  }

  return []
}

onMounted(async () => {
  loadingStrategies.value = true
  loadingSymbols.value = true

  const [strategyResult, contractResult] = await Promise.allSettled([
    (async () => {
      const classRes = await strategyApi.getStrategyClasses()
      const names = classRes.data ?? []
      const metas = await Promise.all(
        names.map(async (name: string) => {
          const detailRes = await strategyApi.getStrategyDetail({ name })
          const params = Object.fromEntries(
            Object.entries(detailRes.data ?? {}).map(([key, value]) => [
              key,
              { label: key, default: (value as any).value, type: (value as any).type },
            ]),
          )
          return { name, label: name, params }
        }),
      )
      return metas
    })(),
    loadContracts(),
  ])

  if (strategyResult.status === 'fulfilled') {
    strategies.value = strategyResult.value
    const firstStrategy = strategies.value[0]
    if (firstStrategy) {
      form.strategy = firstStrategy.name
      currentStrategyMeta.value = firstStrategy
      form.params = buildStrategyParams(firstStrategy)
    }
  } else {
    showToast('获取策略列表失败')
  }

  if (contractResult.status === 'fulfilled') {
    symbols.value = contractResult.value
    if (!symbols.value.length) {
      showToast('未获取到可用合约')
    } else {
      form.symbol = getDefaultSymbol()
      form.brokerType = getDefaultBrokerType()
    }
  } else {
    showToast('获取交易对失败')
  }

  loadingStrategies.value = false
  loadingSymbols.value = false
})

function onStrategyUpdate(value: string[]) {
  const strategyName = value[0] ?? ''
  form.strategy = strategyName
  const meta = strategies.value.find((s) => s.name === strategyName)
  if (meta) {
    currentStrategyMeta.value = meta
    form.params = buildStrategyParams(meta)
  }
  showStrategyPicker.value = false
}

function onSymbolUpdate(value: string[]) {
  const selectedSymbol = value[0] ?? ''
  const selectedContract = symbols.value.find((item) => item.symbol === selectedSymbol)
  form.symbol = selectedSymbol
  form.brokerType = selectedContract?.brokerType ?? ''
  showSymbolPicker.value = false
}

function onIntervalUpdate(value: string[]) {
  form.interval = value[0] ?? '1m'
  showIntervalPicker.value = false
}

function onStartDateUpdate(date: Date) {
  form.startDate = formatDateValue(date)
  showStartDatePicker.value = false
}

function onEndDateUpdate(date: Date) {
  form.endDate = formatDateValue(date)
  showEndDatePicker.value = false
}

async function waitBacktestFinished(jobId: string) {
  const maxAttempts = 120
  for (let i = 0; i < maxAttempts; i++) {
    const res = await backtestingApi.jobStatus({ jobId })
    const status = res.data?.status
    const resultId = res.data?.data?.resultId
    if (status === 'completed' && resultId) return resultId
    if (status === 'failed') throw new Error(res.data?.failedReason || '回测执行失败')
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
  }
  throw new Error('回测执行超时，请稍后在列表查看结果')
}

async function createBacktest(data: BacktestConfig) {
  const createRes = await backtestingApi.create({
    brokerType: data.brokerType as any,
    strategyName: data.strategy,
    strategySetting: data.params ?? {},
    symbol: data.symbol,
    interval: data.interval as any,
    startDate: data.startDate,
    endDate: data.endDate,
    commissionRate: 0.0005,
    assetBalance: data.initialCapital,
    assetName: 'USDT',
  })
  const id = await waitBacktestFinished(createRes.data.jobId)
  return { id }
}

function handleSubmit() {
  if (!form.strategy) {
    showToast('请选择策略')
    return
  }
  if (!form.symbol) {
    showToast('请选择交易对')
    return
  }
  if (!form.brokerType) {
    showToast('未找到交易对对应的 broker')
    return
  }
  if (!form.startDate) {
    showToast('请选择开始日期')
    return
  }
  if (!form.endDate) {
    showToast('请选择结束日期')
    return
  }
  showParamsPopup.value = true
}

async function handleParamsConfirm(params: Record<string, any>) {
  form.params = params
  submitting.value = true
  try {
    const res = await createBacktest({ ...form })
    showToast('回测创建成功')
    router.push({ name: 'backtest-detail', params: { id: res.id } })
  } catch (error) {
    showToast(error instanceof Error ? error.message : '回测创建失败')
  } finally {
    submitting.value = false
  }
}

function getStrategyLabel() {
  return strategies.value.find(s => s.name === form.strategy)?.label ?? ''
}
function getSymbolLabel() {
  return symbols.value.find(s => s.symbol === form.symbol)?.label ?? ''
}
function getIntervalLabel() {
  return intervals.find(i => i.value === form.interval)?.text ?? ''
}
</script>

<template>
  <div class="page">
    <div class="nav-bar">
      <button class="nav-back" @click="router.back()">
        <i class="iconfont icon-left"></i>
      </button>
      <span class="nav-title">新建回测</span>
      <span class="nav-right"></span>
    </div>

    <div class="form-container">
      <div class="card">
        <!-- 策略 -->
        <div class="form-item" @click="showStrategyPicker = true">
          <div class="form-label">策略</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.strategy }">{{ getStrategyLabel() || '请选择策略' }}</span>
            <i class="iconfont icon-right"></i>
          </div>
        </div>

        <!-- 交易对 -->
        <div class="form-item" @click="showSymbolPicker = true">
          <div class="form-label">交易对</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.symbol }">{{ getSymbolLabel() || '请选择交易对' }}</span>
            <i class="iconfont icon-right"></i>
          </div>
        </div>

        <!-- 周期 -->
        <div class="form-item" @click="showIntervalPicker = true">
          <div class="form-label">周期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.interval }">{{ getIntervalLabel() || '请选择周期' }}</span>
            <i class="iconfont icon-right"></i>
          </div>
        </div>

        <!-- 开始日期 -->
        <div class="form-item" @click="showStartDatePicker = true">
          <div class="form-label">开始日期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.startDate }">{{ form.startDate || '请选择开始日期' }}</span>
            <i class="iconfont icon-right"></i>
          </div>
        </div>

        <!-- 结束日期 -->
        <div class="form-item" @click="showEndDatePicker = true">
          <div class="form-label">结束日期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.endDate }">{{ form.endDate || '请选择结束日期' }}</span>
            <i class="iconfont icon-right"></i>
          </div>
        </div>

        <!-- 初始资金 -->
        <div class="form-item">
          <div class="form-label">初始资金 (USDT)</div>
          <input
            type="number"
            class="form-input"
            v-model.number="form.initialCapital"
            placeholder="请输入初始资金"
          />
        </div>
      </div>

      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '创建中...' : '开始回测' }}
      </button>
    </div>

    <!-- 策略选择器 -->
    <m-picker
      v-model:open="showStrategyPicker"
      :value="form.strategy ? [form.strategy] : []"
      :data="[strategyData]"
      :cols="1"
      :cascade="false"
      title="选择策略"
      @update:value="onStrategyUpdate"
    />

    <!-- 交易对选择器 -->
    <m-picker
      v-model:open="showSymbolPicker"
      :value="form.symbol ? [form.symbol] : []"
      :data="[symbolData]"
      :cols="1"
      :cascade="false"
      title="选择交易对"
      @update:value="onSymbolUpdate"
    />

    <!-- 周期选择器 -->
    <m-picker
      v-model:open="showIntervalPicker"
      :value="form.interval ? [form.interval] : []"
      :data="[intervalData]"
      :cols="1"
      :cascade="false"
      title="选择周期"
      @update:value="onIntervalUpdate"
    />

    <!-- 开始日期选择器 -->
    <m-date-picker
      v-model:open="showStartDatePicker"
      :value="form.startDate ? parseDateValue(form.startDate) : new Date()"
      mode="date"
      title="选择开始日期"
      @ok="onStartDateUpdate"
    />

    <!-- 结束日期选择器 -->
    <m-date-picker
      v-model:open="showEndDatePicker"
      :value="form.endDate ? parseDateValue(form.endDate) : new Date()"
      mode="date"
      title="选择结束日期"
      @ok="onEndDateUpdate"
    />

    <!-- 策略参数配置弹窗 -->
    <StrategyParams
      v-model:visible="showParamsPopup"
      :strategy-meta="currentStrategyMeta"
      :params="form.params"
      @confirm="handleParamsConfirm"
    />
  </div>
</template>

<style scoped>
.page {
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
  font-weight: 500;
}

.nav-right {
  width: 40px;
}

.form-container {
  padding: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 14px;
  color: #333;
  width: 100px;
  flex-shrink: 0;
}

.form-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
}

.form-control .placeholder {
  color: #999;
}

.submit-btn {
  width: 100%;
  margin-top: 24px;
  padding: 12px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:active {
  background: #0958d9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
