<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { brokerConfigApi } from '@vtrader/backend/api'
import type { BrokerConfig } from '@vtrader/backend/api'

const router = useRouter()
const brokerCount = ref(0)
const brokerLoading = ref(false)

async function fetchBrokerCount() {
  brokerLoading.value = true
  try {
    const res = await brokerConfigApi.list()
    brokerCount.value = (res.data ?? []).length
  } catch (error) {
    brokerCount.value = 0
  } finally {
    brokerLoading.value = false
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
</script>

<template>
  <div class="page home-page">
    <h2>首页</h2>

    <!-- 券商模块 -->
    <div class="broker-card" @click="goBrokerPage">
      <div class="broker-card-header">
        <span class="broker-card-title">券商</span>
        <button class="broker-add-btn" @click="goAddBroker">+ 新增</button>
      </div>
      <div class="broker-card-body" v-if="!brokerLoading">
        <span v-if="brokerCount > 0" class="broker-count">已配置 {{ brokerCount }} 个券商</span>
        <span v-else class="broker-empty">暂无券商，点击添加</span>
      </div>
      <div class="broker-card-body" v-else>
        <span class="broker-empty">加载中...</span>
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

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
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
  margin-top: 16px;
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
</style>
