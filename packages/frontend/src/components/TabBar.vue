<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

interface TabItem {
  key: string
  label: string
  path: string
  icon: string
}

const router = useRouter()
const route = useRoute()

const tabs: TabItem[] = [
  { key: 'home', label: '首页', path: '/home', icon: 'home' },
  { key: 'backtest', label: '回测', path: '/backtest', icon: 'backtest' },
  { key: 'data', label: '数据管理', path: '/data', icon: 'data' },
]

function switchTab(tab: TabItem) {
  router.push(tab.path)
}

function isActive(tab: TabItem): boolean {
  return route.path === tab.path
}
</script>

<template>
  <div class="tab-bar">
    <div
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: isActive(tab) }"
      @click="switchTab(tab)"
    >
      <!-- 首页图标 -->
      <svg v-if="tab.icon === 'home'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <!-- 回测图标 -->
      <svg v-else-if="tab.icon === 'backtest'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <!-- 数据管理图标 -->
      <svg v-else-if="tab.icon === 'data'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
      <span class="tab-label">{{ tab.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0 8px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.tab-item.active {
  color: #1677ff;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.tab-label {
  font-size: 11px;
  line-height: 1.4;
}
</style>