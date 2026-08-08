<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

function go(page: number) {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="page-btn" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
    <span class="page-info">{{ page }} / {{ totalPages }}</span>
    <button class="page-btn" :disabled="page >= totalPages" @click="go(page + 1)">下一页</button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}
.page-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
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
