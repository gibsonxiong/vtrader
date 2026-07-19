<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '#/store/auth';

defineOptions({ name: 'MobileLayout' });

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const tabs = [
  { key: 'market', label: '行情', icon: '📈', route: '/market-data/overview' },
  { key: 'backtest', label: '回测', icon: '⚡', route: '/backtesting/history' },
];

const activeTab = computed(() => {
  if (route.path.startsWith('/market-data')) return 'market';
  if (route.path.startsWith('/backtesting')) return 'backtest';
  return 'market';
});

function switchTab(tab: typeof tabs[0]) {
  router.push(tab.route);
}

function handleLogout() {
  authStore.logout();
}

// Sub-nav items for each tab
const marketSubs = [
  { label: '数据大纲', to: '/market-data/overview' },
  { label: '行情列表', to: '/market-data/list' },
];
const backtestSubs = [
  { label: '回测历史', to: '/backtesting/history' },
  { label: '回测结果', to: '/backtesting/result' },
];
</script>

<template>
  <div class="mobile-shell">
    <!-- Header -->
    <header class="mobile-header">
      <span class="header-title">VTrader</span>
      <span class="header-logout" @click="handleLogout">退出</span>
    </header>

    <!-- Sub-nav -->
    <nav class="sub-nav" v-if="activeTab === 'market'">
      <router-link
        v-for="s in marketSubs" :key="s.to" :to="s.to"
        class="sub-nav-item" active-class="sub-nav-active"
      >{{ s.label }}</router-link>
    </nav>
    <nav class="sub-nav" v-else>
      <router-link
        v-for="s in backtestSubs" :key="s.to" :to="s.to"
        class="sub-nav-item" active-class="sub-nav-active"
      >{{ s.label }}</router-link>
    </nav>

    <!-- Content -->
    <main class="mobile-content">
      <RouterView />
    </main>

    <!-- Bottom Tab Bar -->
    <nav class="bottom-tabs">
      <div
        v-for="t in tabs" :key="t.key"
        class="tab-item" :class="{ active: activeTab === t.key }"
        @click="switchTab(t)"
      >
        <span class="tab-icon">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.mobile-shell {
  display: flex; flex-direction: column; height: 100vh; max-width: 480px; margin: 0 auto;
  background: #f5f5f5; position: relative;
}
.mobile-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 44px; background: #fff; border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.header-title { font-size: 17px; font-weight: 600; }
.header-logout { font-size: 14px; color: #999; cursor: pointer; }
.sub-nav {
  display: flex; background: #fff; border-bottom: 1px solid #eee; flex-shrink: 0; overflow-x: auto;
}
.sub-nav-item {
  flex: 1; text-align: center; padding: 10px 0; font-size: 14px; color: #666; text-decoration: none;
  border-bottom: 2px solid transparent; white-space: nowrap;
}
.sub-nav-active { color: #1677ff; border-bottom-color: #1677ff; font-weight: 500; }
.mobile-content {
  flex: 1; overflow-y: auto; padding: 12px; -webkit-overflow-scrolling: touch;
}
.bottom-tabs {
  display: flex; background: #fff; border-top: 1px solid #eee; flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.tab-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 8px 0 4px; cursor: pointer; color: #999;
}
.tab-item.active { color: #1677ff; }
.tab-icon { font-size: 22px; line-height: 1; }
.tab-label { font-size: 11px; margin-top: 2px; }
</style>
