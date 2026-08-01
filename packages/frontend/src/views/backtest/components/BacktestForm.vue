<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { showToast } from '@/ui/mobile'
import { strategyApi, brokerConfigApi, marketDataApi } from '@vtrader/backend/api'
import type { BrokerConfig, ContractData } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'

interface StrategyParamMeta { label: string; default: number; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: BacktestConfig): void
}>()

interface BacktestConfig {
  strategy: string
  symbol: string
  brokerId: string
  startDate: string
  endDate: string
  initialCapital: number
  interval: string
  params: Record<string, number>
}

interface SymbolOption {
  brokerId: string
  symbol: string
  label: string
}

const visible = defineModel<boolean>('visible', { default: false })

const contractStore = useContractStore()

const strategies = ref<StrategyMeta[]>([])
const symbols = ref<SymbolOption[]>([])
const loadingStrategies = ref(false)
const loadingSymbols = ref(false)

const intervals = [
  { text: '1 分钟', value: '1m' },
  { text: '5 分钟', value: '5m' },
  { text: '15 分钟', value: '15m' },
  { text: '30 分钟', value: '30m' },
  { text: '1 小时', value: '1h' },
  { text: '4 小时', value: '4h' },
  { text: '1 天', value: '1d' },
]

const currentDate = new Date()

function getDefaultSymbol() {
  return symbols.value[0]?.symbol ?? ''
}

function getDefaultBrokerId() {
  return symbols.value[0]?.brokerId ?? ''
}

function getDefaultForm(): BacktestConfig {
  const firstStrategy = strategies.value[0]
  return {
    strategy: firstStrategy?.name ?? '',
    symbol: getDefaultSymbol(),
    brokerId: getDefaultBrokerId(),
    startDate: `${currentDate.getFullYear()}-01-01`,
    endDate: `${currentDate.getFullYear()}-12-31`,
    initialCapital: 10000,
    interval: '1m',
    params: firstStrategy ? buildStrategyParams(firstStrategy) : {},
  }
}

const form = reactive<BacktestConfig>(getDefaultForm())

// Current strategy meta for params display
const currentStrategyMeta = ref<StrategyMeta | null>(null)

function buildStrategyParams(meta: StrategyMeta): Record<string, number> {
  const defaults: Record<string, number> = {}
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

// 策略选择器
const showStrategyPicker = ref(false)
const strategyData = computed(() => strategies.value.map((s) => ({ label: s.label, value: s.name })))

// 交易对选择器
const showSymbolPicker = ref(false)
const symbolData = computed(() => symbols.value.map((item) => ({ label: item.label, value: item.symbol })))

// 周期选择器
const showIntervalPicker = ref(false)
const intervalData = intervals.map(i => ({ label: i.text, value: i.value }))

// 日期选择器
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 将 Date 对象转换为 YYYY-MM-DD 字符串
function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 将 YYYY-MM-DD 字符串转换为 Date 对象
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
        brokerId: broker.id,
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
              { label: key, default: Number((value as any).value ?? 0), type: (value as any).type },
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
      form.brokerId = getDefaultBrokerId()
    }
  } else {
    showToast('获取交易对失败')
  }

  loadingStrategies.value = false
  loadingSymbols.value = false
})

// 弹窗打开时重置为默认值
watch(visible, (val) => {
  if (val) {
    Object.assign(form, getDefaultForm())
    // 同步更新策略元数据
    const meta = strategies.value.find((s) => s.name === form.strategy)
    currentStrategyMeta.value = meta ?? null
  }
})

function onStrategyUpdate(value: string[]) {
  const strategyName = value[0] ?? ''
  form.strategy = strategyName
  // 直接更新策略元数据和参数
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
  form.brokerId = selectedContract?.brokerId ?? ''
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

function handleSubmit() {
  if (!form.strategy) {
    showToast('请选择策略')
    return
  }
  if (!form.symbol) {
    showToast('请选择交易对')
    return
  }
  if (!form.brokerId) {
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
  emit('submit', { ...form })
  visible.value = false
}

// 获取显示文本
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
  <m-popup v-model:open="visible" placement="bottom" title="回测配置" :showOk="false" :showCancel="false" style="maxHeight: 85vh">
    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <!-- 策略 -->
        <div class="form-item" @click="showStrategyPicker = true">
          <div class="form-label">策略</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.strategy }">{{ getStrategyLabel() || '请选择策略' }}</span>
            <span class="arrow">›</span>
          </div>
        </div>

        <!-- Dynamic strategy params -->
        <template v-if="currentStrategyMeta">
          <div v-for="(meta, key) in currentStrategyMeta.params" :key="key" class="form-item">
            <div class="form-label">{{ meta.label }}</div>
            <input
              type="number"
              class="form-input"
              :value="form.params[key]"
              :placeholder="'请输入' + meta.label"
              @input="form.params[key] = Number(($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>

        <!-- 交易对 -->
        <div class="form-item" @click="showSymbolPicker = true">
          <div class="form-label">交易对</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.symbol }">{{ getSymbolLabel() || '请选择交易对' }}</span>
            <span class="arrow">›</span>
          </div>
        </div>

        <!-- 周期 -->
        <div class="form-item" @click="showIntervalPicker = true">
          <div class="form-label">周期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.interval }">{{ getIntervalLabel() || '请选择周期' }}</span>
            <span class="arrow">›</span>
          </div>
        </div>

        <!-- 开始日期 -->
        <div class="form-item" @click="showStartDatePicker = true">
          <div class="form-label">开始日期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.startDate }">{{ form.startDate || '请选择开始日期' }}</span>
            <span class="arrow">›</span>
          </div>
        </div>

        <!-- 结束日期 -->
        <div class="form-item" @click="showEndDatePicker = true">
          <div class="form-label">结束日期</div>
          <div class="form-control">
            <span :class="{ placeholder: !form.endDate }">{{ form.endDate || '请选择结束日期' }}</span>
            <span class="arrow">›</span>
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

        <div class="form-actions">
          <button type="submit" class="primary-btn">开始回测</button>
        </div>
      </form>

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
    </div>
  </m-popup>
</template>

<style scoped>
.form-container {
  padding: 20px 16px 30px;
}

.form-item {
  margin-bottom: 12px;
}

.form-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #1677ff;
}

.form-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.form-control .placeholder {
  color: #999;
}

.form-control .arrow {
  color: #999;
  font-size: 18px;
}

.form-actions {
  padding: 20px 16px 0;
}

.primary-btn {
  width: 100%;
  height: 40px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
