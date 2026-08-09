<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { brokerConfigApi } from '@vtrader/backend/api'
import type { BrokerModel, BrokerType } from '@vtrader/backend/api'
import { showLoadingToast, showToast } from '../../ui/mobile'
import { useContractStore } from '@/stores/contract'
import { formatBrokerType } from '@/utils/broker'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router = useRouter()
const contractStore = useContractStore()

const brokerCount = ref(0)
const brokerLoading = ref(false)
const brokers = ref<BrokerModel[]>([])

const syncingBrokerType = ref<string | null>(null)

// 按 brokerType 去重
const uniqueBrokerTypes = computed(() => {
  return [...new Set(brokers.value.map(b => b.brokerType))]
})

async function fetchBrokerCount() {
  brokerLoading.value = true
  try {
    const res = await brokerConfigApi.list()
    brokers.value = res.data ?? []
    brokerCount.value = brokers.value.length
    // 获取每个 brokerType 的合约数量
    await fetchContractStats()
  } catch (error) {
    console.error('获取经纪商配置失败:', error)
    brokerCount.value = 0
  } finally {
    brokerLoading.value = false
  }
}

async function fetchContractStats() {
  // 获取所有唯一的 brokerType
  const brokerTypes = [...new Set(brokers.value.map(b => b.brokerType))]
  for (const brokerType of brokerTypes) {
    await contractStore.fetchContracts(brokerType as BrokerType)
  }
}

async function syncContracts(brokerType: BrokerType) {
  syncingBrokerType.value = brokerType
  const handle = showLoadingToast({ message: '同步中...', duration: 0 })
  try {
    const count = await contractStore.syncContracts(brokerType)
    showToast(`同步成功，共 ${count} 个合约`)
  } catch (error) {
    console.error('同步合约失败:', error)
    showToast('同步失败')
  } finally {
    handle?.hide?.()
    syncingBrokerType.value = null
  }
}

onMounted(fetchBrokerCount)

function goBrokerPage() {
  router.push('/broker')
}

function goAddBroker(e: Event) {
  e.stopPropagation()
  router.push('/broker')
}

function goContracts(brokerType: string) {
  router.push({ path: '/contracts', query: { brokerType } })
}
</script>

<template>
  <div class="page home-page">
    <!-- 经经纪商模块 -->
    <div class="broker-card" @click="goBrokerPage">
      <div class="broker-card-header">
        <span class="broker-card-title">经纪商</span>
        <button class="broker-add-btn" @click="goAddBroker">+ 新增</button>
      </div>
      <div class="broker-card-body" v-if="!brokerLoading">
        <span v-if="brokerCount > 0" class="broker-count">已配置 {{ brokerCount }} 个经纪商</span>
        <span v-else class="broker-empty">暂无经纪商，点击添加</span>
      </div>
      <div class="broker-card-body" v-else>
        <span class="broker-empty">加载中...</span>
      </div>
    </div>

    <!-- 合约统计模块 -->
    <div class="contract-section">
      <div class="section-header">
        <span class="section-title">合约统计</span>
      </div>
      <div class="contract-list" v-if="!brokerLoading">
        <div
          v-for="brokerType in uniqueBrokerTypes"
          :key="brokerType"
          class="contract-item"
          @click="goContracts(brokerType)"
        >
          <div class="contract-info">
            <span class="contract-name">{{ formatBrokerType(brokerType) }}</span>
            <span class="contract-count">
              {{ contractStore.getContractCount(brokerType) }} 个合约
            </span>
          </div>
          <button
            class="sync-btn"
            :disabled="syncingBrokerType === brokerType"
            @click.stop="syncContracts(brokerType as BrokerType)"
          >
            {{ syncingBrokerType === brokerType ? '同步中...' : '同步' }}
          </button>
        </div>
        <div v-if="uniqueBrokerTypes.length === 0" class="contract-empty">
          暂无经纪商，请先配置经纪商
        </div>
      </div>
      <div class="contract-list" v-else>
        <div class="contract-empty">加载中...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 20px 16px;
  background: #f5f5f5;
}

.page h2 {
  font-size: 20px;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  margin-bottom: 16px;
  color: #666;
  text-align: center;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.label {
  margin-bottom: 8px;
  color: #888;
  font-size: 13px;
}

.value {
  color: #222;
  font-size: 24px;
  font-weight: 600;
}

.broker-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.broker-card:active {
  background: #fafafa;
}

.broker-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.broker-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.broker-add-btn {
  padding: 4px 12px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.broker-add-btn:active {
  background: #0958d9;
}

.broker-card-body {
  font-size: 14px;
}

.broker-count {
  color: #666;
}

.broker-empty {
  color: #999;
}

/* 合约统计模块 */
.contract-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.contract-list {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.contract-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.contract-item:active {
  background: #fafafa;
}

.contract-item:last-child {
  border-bottom: none;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contract-name {
  font-size: 14px;
  color: #222;
  font-weight: 500;
}

.contract-count {
  font-size: 13px;
  color: #666;
}

.sync-btn {
  padding: 6px 14px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.sync-btn:active {
  background: #0958d9;
}

.sync-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.contract-empty {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}
</style>
