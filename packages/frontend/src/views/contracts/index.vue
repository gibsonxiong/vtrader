<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractStore } from '@/stores/contract'
import { showToast, showLoadingToast } from '@/ui/mobile'
import { formatBrokerType } from '@/utils/broker'

const route = useRoute()
const router = useRouter()
const contractStore = useContractStore()

const brokerType = computed(() => route.query.brokerType as string)
const contracts = computed(() => contractStore.contractsMap.get(brokerType.value) || [])

// 搜索关键词
const searchText = ref('')

// 过滤后的合约列表
const filteredContracts = computed(() => {
  if (!searchText.value) return contracts.value
  const keyword = searchText.value.toLowerCase()
  return contracts.value.filter(c =>
    c.symbol.toLowerCase().includes(keyword) ||
    c.name.toLowerCase().includes(keyword)
  )
})

// 按产品类型分组
const groupedContracts = computed(() => {
  const groups: Record<string, typeof contracts.value> = {}
  for (const contract of filteredContracts.value) {
    const product = contract.product || 'OTHER'
    if (!groups[product]) {
      groups[product] = []
    }
    groups[product].push(contract)
  }
  return groups
})

const productLabels: Record<string, string> = {
  FUTURES: '交割',
  SPOT: '现货',
  SWAP: '永续',
  OPTION: '期权',
  OTHER: '其他',
}

// 折叠状态（默认全部展开）
const collapsedGroups = ref<Set<string>>(new Set())

function toggleGroup(product: string) {
  if (collapsedGroups.value.has(product)) {
    collapsedGroups.value.delete(product)
  } else {
    collapsedGroups.value.add(product)
  }
  // 触发响应式更新
  collapsedGroups.value = new Set(collapsedGroups.value)
}

function isGroupCollapsed(product: string): boolean {
  return collapsedGroups.value.has(product)
}

async function loadContracts() {
  if (brokerType.value) {
    await contractStore.fetchContracts(brokerType.value)
  }
}

async function handleSync() {
  if (!brokerType.value) return
  const handle = showLoadingToast({ message: '同步中...', duration: 0 })
  try {
    const count = await contractStore.syncContracts(brokerType.value)
    showToast(`同步成功，共 ${count} 个合约`)
  } catch {
    showToast('同步失败')
  } finally {
    handle?.hide?.()
  }
}

function goBack() {
  router.back()
}

onMounted(loadContracts)
</script>

<template>
  <div class="page contracts-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <span class="title">{{ formatBrokerType(brokerType) }}</span>
      <button class="sync-btn" @click="handleSync" :disabled="contractStore.loading">
        同步
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索合约名称或符号..."
        class="search-input"
      />
    </div>

    <!-- 合约统计 -->
    <div class="stats-bar">
      <span>共 {{ contracts.length }} 个合约</span>
      <span v-if="searchText">，筛选后 {{ filteredContracts.length }} 个</span>
    </div>

    <!-- 合约列表 -->
    <div class="contract-list" v-if="!contractStore.loading">
      <template v-if="filteredContracts.length > 0">
        <div v-for="(group, product) in groupedContracts" :key="product" class="product-group">
          <div class="group-header" @click="toggleGroup(product)">
            <span class="group-title">{{ productLabels[product] || product }}</span>
            <div class="group-right">
              <span class="group-count">{{ group.length }}</span>
              <svg class="group-arrow" :class="{ 'collapsed': isGroupCollapsed(product) }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          <div class="contract-items" v-show="!isGroupCollapsed(product)">
            <div v-for="contract in group" :key="contract.symbol" class="contract-item">
              <div class="contract-main">
                <span class="contract-symbol">{{ contract.symbol }}</span>
                <span class="contract-name">{{ contract.name }}</span>
              </div>
              <div class="contract-meta">
                <span class="meta-item">最小交易量: {{ contract.minVolume }}</span>
                <span class="meta-item">价格精度: {{ contract.priceTick }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <template v-if="searchText">
          未找到匹配的合约
        </template>
        <template v-else>
          暂无合约数据，请点击同步按钮获取
        </template>
      </div>
    </div>

    <!-- 加载中 -->
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  border-radius: 8px;
}

.back-btn:active {
  background: #f0f0f0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.sync-btn {
  padding: 6px 14px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.sync-btn:active {
  background: #0958d9;
}

.sync-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.search-bar {
  padding: 8px 12px;
  background: #fff;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1677ff;
}

.stats-bar {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
}

.contract-list {
  padding: 0 16px;
}

.product-group {
  margin-bottom: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fff;
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.group-header:active {
  background: #fafafa;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.group-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-count {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.group-arrow {
  transition: transform 0.2s ease;
}

.group-arrow.collapsed {
  transform: rotate(-90deg);
}

.contract-items {
  background: #fff;
  border-radius: 0 0 10px 10px;
}

.contract-item {
  padding: 12px 14px;
  border-bottom: 1px solid #f5f5f5;
}

.contract-item:last-child {
  border-bottom: none;
}

.contract-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.contract-symbol {
  font-size: 14px;
  font-weight: 500;
  color: #222;
}

.contract-name {
  font-size: 12px;
  color: #999;
}

.contract-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 12px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #eee;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
