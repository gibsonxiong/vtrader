<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { showToast } from '@/ui/mobile'
import { strategyApi, brokerConfigApi, backtestingApi } from '@vtrader/backend/api'
import type { BrokerConfig, ContractData } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'
import StrategyParams from './components/StrategyParams.vue'
import NavBar from '@/components/NavBar.vue'
import NumberInput from '@/components/NumberInput.vue'
import PickerInput from '@/components/PickerInput.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'

interface StrategyParamMeta { label: string; default: any; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

interface BacktestConfig {
  strategy: string
  symbol: string
  brokerType: string
  startDate: Dayjs
  endDate: Dayjs
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
    startDate: dayjs('2025-01-01'),
    endDate: dayjs('2025-05-01'),
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

const strategyData = computed(() => strategies.value.map((s) => ({ label: s.label, value: s.name })))

const symbolData = computed(() => symbols.value.map((item) => ({ label: item.label, value: item.symbol })))

const intervalData = intervals.map(i => ({ label: i.text, value: i.value }))

const showParamsPopup = ref(false)

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

watch(() => form.symbol, (symbol) => {
  const selectedContract = symbols.value.find((item) => item.symbol === symbol)
  form.brokerType = selectedContract?.brokerType ?? ''
})

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
    startDate: data.startDate.format('YYYY-MM-DD'),
    endDate: data.endDate.format('YYYY-MM-DD'),
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
</script>

<template>
  <div class="page">
    <NavBar title="新建回测" />

    <div class="form-container">
        <!-- 策略 -->
        <div class="form-item">
          <div class="form-label">策略</div>
          <PickerInput v-model="form.strategy" :data="strategyData" title="选择策略" placeholder="请选择策略" />
        </div>

        <!-- 交易对 -->
        <div class="form-item">
          <div class="form-label">交易对</div>
          <PickerInput v-model="form.symbol" :data="symbolData" title="选择交易对" placeholder="请选择交易对" />
        </div>

        <!-- 周期 -->
        <div class="form-item">
          <div class="form-label">周期</div>
          <PickerInput v-model="form.interval" :data="intervalData" title="选择周期" placeholder="请选择周期" />
        </div>

        <!-- 开始日期 -->
        <div class="form-item">
          <div class="form-label">开始日期</div>
          <DatePickerInput v-model="form.startDate" title="选择开始日期" placeholder="请选择开始日期" />
        </div>

        <!-- 结束日期 -->
        <div class="form-item">
          <div class="form-label">结束日期</div>
          <DatePickerInput v-model="form.endDate" title="选择结束日期" placeholder="请选择结束日期" />
        </div>

        <!-- 初始资金 -->
        <div class="form-item">
          <div class="form-label">初始资金 (USDT)</div>
          <NumberInput
            v-model="form.initialCapital"
            placeholder="请输入初始资金"
          />
        </div>

      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '创建中...' : '开始回测' }}
      </button>
    </div>

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

.form-container {
  background: #fff;
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
