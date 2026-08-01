<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/ui/mobile'
import BacktestForm from './components/BacktestForm.vue'
import BacktestList from './components/BacktestList.vue'
import { backtestingApi } from '@vtrader/backend/api'

interface CreateBacktestParams { strategy: string; symbol: string; brokerType: string; startDate: string; endDate: string; initialCapital: number; interval: string; params?: Record<string, number> }
interface BacktestRecord { id: number; strategy: string; symbol: string; startDate: string; endDate: string; initialCapital: number; finalCapital: number; createdAt: string }

async function waitBacktestFinished(jobId: string) {
  const maxAttempts = 120
  for (let i = 0; i < maxAttempts; i++) {
    const res = await backtestingApi.jobStatus({ jobId })
    const status = res.data?.status
    const resultId = res.data?.result?.id
    if (status === 'completed' && resultId) return resultId
    if (status === 'failed') throw new Error(res.data?.error || '回测执行失败')
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
  }
  throw new Error('回测执行超时，请稍后在列表查看结果')
}

async function createBacktest(data: CreateBacktestParams) {
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

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0)
}

async function getBacktestList(params?: { page?: number; pageSize?: number }) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const res = await backtestingApi.queryMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { id: 'desc' },
  })
  const list: BacktestRecord[] = (res.data.models ?? []).map((model: any) => ({
    id: model.id,
    strategy: model.strategyName,
    symbol: model.symbol,
    startDate: model.startDate,
    endDate: model.endDate,
    initialCapital: toNumber(model.startBalance),
    finalCapital: toNumber(model.endBalance),
    createdAt: model.endDate,
  }))
  return { list, total: res.data.total ?? 0, page, pageSize }
}

const router = useRouter()

const showForm = ref(false)
const records = ref<BacktestRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

async function fetchList() {
  const res = await getBacktestList({ page: page.value, pageSize })
  records.value = res.list
  total.value = res.total
}

onMounted(fetchList)

function onPageChange(newPage: number) {
  page.value = newPage
  fetchList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSubmit(data: CreateBacktestParams) {
  try {
    const res = await createBacktest(data)
    showToast('回测创建成功')
    router.push({ name: 'backtest-detail', params: { id: res.id } })
  } catch (error) {
    showToast(error instanceof Error ? error.message : '回测创建失败')
  }
}
</script>

<template>
  <div class="page backtest-page">
    <button class="primary-btn" @click="showForm = true">
      + 新增回测
    </button>

    <BacktestList
      :records="records"
      :total="total"
      :page="page"
      :page-size="pageSize"
      @page-change="onPageChange"
    />

    <BacktestForm v-model:visible="showForm" @submit="handleSubmit" />
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
}

.primary-btn {
  width: 100%;
  padding: 12px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.primary-btn:active {
  background: #0958d9;
}
</style>
