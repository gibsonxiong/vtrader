<script setup lang="ts">
import { inject, type ComputedRef } from 'vue'

defineProps<{
  title: string
}>()

const titlePosition = inject<ComputedRef<'left' | 'top'>>('cellTitlePosition')
const titleWidth = inject<ComputedRef<number>>('cellTitleWidth')
</script>

<template>
  <div class="cell" :class="{ 'cell-top': titlePosition?.value === 'top' }">
    <span class="cell-title" :style="titlePosition?.value !== 'top' ? { width: titleWidth + 'px' } : undefined">{{ title }}</span>
    <span class="cell-value"><slot /></span>
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.cell.cell-top {
  flex-direction: column;
  gap: 4px;
}

.cell-title {
  color: #666;
  flex-shrink: 0;
}

.cell-value {
  color: #333;
  flex: 1;
}
</style>
