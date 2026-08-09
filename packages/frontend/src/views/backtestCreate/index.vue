<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { showToast } from '@/ui/mobile'
import { strategyApi, brokerConfigApi, backtestingApi } from '@vtrader/backend/api'
import type { BrokerModel, BrokerType, ContractData, Interval } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'
import StrategyParams from './components/StrategyParams.vue'
import NavBar from '@/components/NavBar.vue'
import NumberInput from '@/components/NumberInput.vue'
import PickerInput from '@/components/PickerInput.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import Button from '@/components/Button.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

export interface StrategyParamMeta { label: string; default: string | number | boolean | undefined; type?: string }
export interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

interface BacktestConfig {
  strategyName: string
  symbol: string
  brokerType: string
  startDate: Dayjs
  endDate: Dayjs
  assetBalance: number
  interval: string
  strategySetting: Record<string, any>
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
    strategyName: firstStrategy?.name ?? '',
    symbol: getDefaultSymbol(),
    brokerType: getDefaultBrokerType(),
    startDate: dayjs('2025-01-01'),
    endDate: dayjs('2025-05-01'),
    assetBalance: 10000,
    interval: '1m',
    strategySetting: firstStrategy ? buildStrategyParams(firstStrategy) : {},
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

watch(() => form.strategyName, (name) => {
  currentStrategyMeta.value = strategies.value.find((s) => s.name === name) ?? null
  if (currentStrategyMeta.value) {
    form.strategySetting = buildStrategyParams(currentStrategyMeta.value)
  }
})

const strategyData = computed(() => strategies.value.map((s) => ({ label: s.label, value: s.name })))

const symbolData = computed(() => symbols.value.map((item) => ({ label: item.label, value: item.symbol })))

const intervalData = intervals.map(i => ({ label: i.text, value: i.value }))

const showParamsPopup = ref(false)

async function loadContracts() {
  const brokerRes = await brokerConfigApi.list()
  const brokers = (brokerRes.data ?? []).sort((a: BrokerModel, b: BrokerModel) => {
    const aIsTestnet = a.brokerType.includes('TESTNET')
    const bIsTestnet = b.brokerType.includes('TESTNET')
    return Number(aIsTestnet) - Number(bIsTestnet)
  })

  for (const broker of brokers) {
    const contracts = await contractStore.fetchContracts(broker.brokerType)
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
              { label: key, default: value.value, type: value.type },
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
      form.strategyName = firstStrategy.name
      currentStrategyMeta.value = firstStrategy
      form.strategySetting = buildStrategyParams(firstStrategy)
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
    const resultId = res.data?.data?.backtesting.id
    if (status === 'completed' && resultId) return resultId
    if (status === 'failed') throw new Error(res.data?.failedReason || '回测执行失败')
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
  }
  throw new Error('回测执行超时，请稍后在列表查看结果')
}

async function createBacktest(data: BacktestConfig) {
  const createRes = await backtestingApi.create({
    brokerType: data.brokerType as BrokerType,
    strategyName: data.strategyName,
    strategySetting: data.strategySetting ?? {},
    symbol: data.symbol,
    interval: data.interval as Interval,
    startDate: data.startDate.format('YYYY-MM-DD'),
    endDate: data.endDate.format('YYYY-MM-DD'),
    commissionRate: 0.0005,
    assetBalance: data.assetBalance,
    assetName: 'USDT',
  })
  const id = await waitBacktestFinished(createRes.data.jobId)
  return { id }
}

function handleSubmit() {
  if (!form.strategyName) {
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

async function handleParamsConfirm(strategySetting: Record<string, any>) {
  form.strategySetting = strategySetting
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
        <CellGroup bordered>
          <!-- 策略 -->
          <Cell title="策略">
            <PickerInput v-model="form.strategyName" :data="strategyData" title="选择策略" placeholder="请选择策略" />
          </Cell>

          <!-- 交易对 -->
          <Cell title="交易对">
            <PickerInput v-model="form.symbol" :data="symbolData" title="选择交易对" placeholder="请选择交易对" />
          </Cell>

          <!-- 周期 -->
          <Cell title="周期">
            <PickerInput v-model="form.interval" :data="intervalData" title="选择周期" placeholder="请选择周期" />
          </Cell>

          <!-- 开始日期 -->
          <Cell title="开始日期">
            <DatePickerInput v-model="form.startDate" title="选择开始日期" placeholder="请选择开始日期" />
          </Cell>

          <!-- 结束日期 -->
          <Cell title="结束日期">
            <DatePickerInput v-model="form.endDate" title="选择结束日期" placeholder="请选择结束日期" />
          </Cell>

          <!-- 初始资金 -->
          <Cell title="初始资金 (USDT)">
            <NumberInput
              v-model="form.assetBalance"
              placeholder="请输入初始资金"
            />
          </Cell>
        </CellGroup>

      <Button :loading="submitting" :mt="24" @click="handleSubmit">
        {{ submitting ? '创建中...' : '开始回测' }}
      </Button>
    </div>

    <!-- 策略参数配置弹窗 -->
    <StrategyParams
      v-model:visible="showParamsPopup"
      :strategy-meta="currentStrategyMeta"
      :params="form.strategySetting"
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

</style>
