<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const router = useRouter()
</script>

<template>
  <div class="nav-bar">
    <div class="nav-left">
      <button class="nav-back" @click="router.back()">
        <i class="iconfont icon-left"></i>
      </button>
      <slot name="left"></slot>
    </div>
    <span class="nav-title">{{ title }}</span>
    <div class="nav-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 40px;
}
.nav-back {
  background: none;
  border: none;
  font-size: 14px;
  color: #1677ff;
  cursor: pointer;
  padding: 0;
}
.nav-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.nav-right {
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>