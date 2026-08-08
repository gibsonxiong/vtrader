<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'
interface BacktestRecord { id: number; strategy: string; symbol: string; startDate: string; endDate: string; initialCapital: number; finalCapital: number; createdAt: string }

const router = useRouter()

const props = defineProps<{
  records: BacktestRecord[]
  total: number
  page: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

function goDetail(id: number) {
  router.push({ name: 'backtest-detail', params: { id } })
}
</script>

<template>
  <div class="backtest-list">
    <div v-if="records.length === 0" class="empty">
      <svg viewBox="0 0 80 80" fill="none" style="width: 120px; height: 120px;">
        <rect x="10" y="30" width="12" height="30" rx="2" fill="#e5e5e5" />
        <rect x="26" y="20" width="12" height="40" rx="2" fill="#e5e5e5" />
        <rect x="42" y="35" width="12" height="25" rx="2" fill="#e5e5e5" />
        <rect x="58" y="15" width="12" height="45" rx="2" fill="#e5e5e5" />
      </svg>
      <p style="color: #999; text-align: center;">暂无回测记录</p>
      <p style="color: #bbb; font-size: 13px; margin-top: 4px; text-align: center;">点击上方按钮开始第一次回测</p>
    </div>

    <div v-else class="list">
      <div v-for="record in records" :key="record.id" class="card" @click="goDetail(record.id)">
        <div class="card-header">
          <span class="strategy">{{ record.strategy }}</span>
          <m-tag color="primary" fill="outline">{{ record.symbol }}</m-tag>
        </div>

        <CellGroup>
          <Cell title="日期范围">{{ dayjs(record.startDate).format('YYYY-MM-DD') + ' ~ ' + dayjs(record.endDate).format('YYYY-MM-DD') }}</Cell>
          <Cell title="初始资金">{{ record.initialCapital.toLocaleString() + ' USDT' }}</Cell>
          <Cell title="最终资金">{{ record.finalCapital.toLocaleString() + ' USDT' }}</Cell>
        </CellGroup>

        <div class="card-footer">
          <span class="date">{{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </div>
      </div>
    </div>

    <Pagination
      v-if="total > pageSize"
      :page="page"
      :total-pages="totalPages"
      @page-change="emit('page-change', $event)"
    />
  </div>
</template>

<style scoped>
.backtest-list {
  margin-top: 16px;
}

.empty {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.card-footer {
  padding: 0px 16px 10px;
}

.card-footer .date {
  font-size: 12px;
  color: #bbb;
}
</style>
