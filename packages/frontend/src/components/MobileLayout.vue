<script setup lang="ts">
import TabBar from './TabBar.vue'
</script>

<template>
  <div class="mobile-layout">
    <div class="content">
      <router-view />
    </div>
    <TabBar />
  </div>
</template>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  padding-bottom: 56px; /* 为底部 TabBar 留出空间 */
}
</style>