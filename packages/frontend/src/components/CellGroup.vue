<script setup lang="ts">
import { provide, computed } from 'vue'

const props = withDefaults(defineProps<{
  bordered?: boolean
  titlePosition?: 'left' | 'top'
  titleWidth?: number
}>(), {
  bordered: false,
  titlePosition: 'left',
  titleWidth: 100,
})

provide('cellTitlePosition', computed(() => props.titlePosition))
provide('cellBordered', computed(() => props.bordered))
provide('cellTitleWidth', computed(() => props.titleWidth))
</script>

<template>
  <div class="cell-group" :class="{ bordered }">
    <slot />
  </div>
</template>

<style scoped>
.cell-group {
  padding: 8px 16px;
}

.cell-group.bordered {
  padding: 0;
}

.cell-group.bordered :deep(.cell) {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.cell-group.bordered :deep(.cell:last-child) {
  border-bottom: none;
}
</style>
