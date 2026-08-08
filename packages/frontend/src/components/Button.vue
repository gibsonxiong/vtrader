<script setup lang="ts">
defineProps<{
  disabled?: boolean
  loading?: boolean
  mt?: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    class="button"
    :style="{ marginTop: mt ? mt + 'px' : undefined }"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.button {
  width: 100%;
  padding: 10px 0;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.button:active {
  background: #0958d9;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>