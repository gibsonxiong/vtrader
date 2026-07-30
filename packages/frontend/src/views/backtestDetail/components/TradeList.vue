<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
interface TradeRecord { time: string; price: number; amount: number; profit: number; type: 'buy' | 'sell' }

const props = defineProps<{
  trades: TradeRecord[]
}>()

const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(props.trades.length / pageSize))

const sortedTrades = computed(() => {
  return [...props.trades].reverse()
})

/**
 * 当前页的交易数据
 * 根据当前页码从已排序的交易列表中切片获取对应数据
 */
const paginatedTrades = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedTrades.value.slice(start, start + pageSize)
})

function onPageChange(page: number) {
  currentPage.value = page
}
</script>

<template>
  <div class="trade-section">
    <h3 class="section-title">交易记录 ({{ trades.length }})</h3>
    <div class="trade-list">
      <div class="trade-header-row">
        <span class="col-seq">#</span>
        <span class="col_type">方向</span>
        <span class="col-time">时间</span>
        <span class="col-field">价格</span>
        <span class="col-field">数量</span>
        <span class="col-field">盈亏</span>
      </div>
      <div v-for="(trade, index) in paginatedTrades" :key="(currentPage - 1) * pageSize + index" class="trade-item">
        <span class="trade-seq">{{ trades.length - ((currentPage - 1) * pageSize + index) }}</span>
        <span :class="['trade-type', trade.type]">{{ trade.type === 'buy' ? '买入' : '卖出' }}</span>
        <span class="trade-time">{{ dayjs(trade.time).format('MM-DD HH:mm') }}</span>
        <span class="trade-value">{{ trade.price.toFixed(2) }}</span>
        <span class="trade-value">{{ trade.amount.toFixed(4) }}</span>
        <span class="trade-value" :class="trade.profit >= 0 ? 'profit' : 'loss'">
          {{ trade.profit >= 0 ? '+' : '' }}{{ trade.profit.toFixed(2) }}
        </span>
      </div>
    </div>
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage <= 1" @click="onPageChange(currentPage - 1)">上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage >= totalPages" @click="onPageChange(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.trade-section {
  padding: 12px 16px;
  margin-top: 12px;
  background: #fff;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.trade-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.trade-header-row {
  display: flex;
  align-items: center;
  padding: 8px 6px;
  background: #fafafa;
  font-size: 13px;
  color: #999;
}

.trade-item {
  display: flex;
  align-items: center;
  padding: 10px 6px;
  background: #fff;
}

.trade-type {
  font-size: 12px;
  font-weight: 500;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.6;
}

.trade-type.buy {
  color: #e74c3c;
}

.trade-type.sell {
  color: #22c55e;
}

.trade-time {
  font-size: 12px;
  color: #999;
}

.trade-value {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.trade-value.profit {
  color: #e74c3c;
}

.trade-value.loss {
  color: #22c55e;
}

.col-seq,
.col-type,
.col-time,
.col-field {
  flex: none;
}

.col-seq {
  width: 24px;
  text-align: center;
}

.col-type {
  width: 36px;
}

.col-time {
  width: 90px;
}

.col-field {
  flex: 1;
  text-align: right;
}

.trade-item > * {
  flex: none;
}

.trade-item .trade-seq {
  width: 24px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.trade-item .trade-type {
  width: 36px;
}

.trade-item .trade-time {
  width: 90px;
}

.trade-item .trade-value {
  flex: 1;
  text-align: right;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.page-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:active:not(:disabled) {
  background: #e0e0e0;
}

.page-info {
  font-size: 14px;
  color: #666;
}
</style>
