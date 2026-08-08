<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BacktestList from './components/BacktestList.vue'
import { backtestingApi } from '@vtrader/backend/api'
import Button from '@/components/Button.vue'

interface BacktestRecord { id: number; strategy: string; symbol: string; startDate: string; endDate: string; initialCapital: number; finalCapital: number; createdAt: string }

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
</script>

<template>
  <div class="page backtest-page">
    <Button @click="router.push({ name: 'backtest-create' })">
      + 新增回测
    </Button>

    <BacktestList
      :records="records"
      :total="total"
      :page="page"
      :page-size="pageSize"
      @page-change="onPageChange"
    />
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
}
</style>
