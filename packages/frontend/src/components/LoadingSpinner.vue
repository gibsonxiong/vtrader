<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="loading">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #eee;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-text {
  margin-top: 8px;
  font-size: 13px;
  color: #999;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>