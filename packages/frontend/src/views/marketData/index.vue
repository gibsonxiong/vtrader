<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marketDataApi } from '@vtrader/backend/api'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router = useRouter()

interface MarketDataFileOverview { version: 1; brokerType: string; symbol: string; interval: string; ranges: [string, string][]; updatedAt: string; count: number }

// 文件概览缓存（按 brokerType 分组）
const fileOverviewsByBroker = ref<Record<string, MarketDataFileOverview[]>>({})
const loadingOverviews = ref(false)

// 获取文件概览（按 brokerType 分组）
async function loadFileOverviews() {
  loadingOverviews.value = true
  try {
    const res = await marketDataApi.getBarOverviews()
    const data = res.data ?? []
    const grouped: Record<string, MarketDataFileOverview[]> = {}
    for (const overview of data) {
      const broker = overview.brokerType
      if (!grouped[broker]) grouped[broker] = []
      grouped[broker].push(overview)
    }
    // 每个分组内按 symbol 排序
    for (const files of Object.values(grouped)) {
      files.sort((a, b) => a.symbol.localeCompare(b.symbol))
    }
    fileOverviewsByBroker.value = grouped
  } catch (e: any) {
    console.error('加载文件概览失败:', e)
  } finally {
    loadingOverviews.value = false
  }
}

onMounted(() => {
  loadFileOverviews()
})

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-'
  return dateStr.substring(0, 10)
}

function formatDateRange(ranges: [string, string][] | undefined): string {
  if (!ranges || ranges.length === 0) return ''
  const first = ranges[0]!
  const last = ranges[ranges.length - 1]!
  return `${formatDate(first[0])} ~ ${formatDate(last[1])}`
}
</script>

<template>
  <div class="data-mgr-page">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <h3 class="section-title">数据概览</h3>
      <button class="download-btn" @click="router.push({ name: 'data-download' })">
        + 下载数据
      </button>
    </div>

    <LoadingSpinner v-if="loadingOverviews" />

    <div v-else-if="Object.keys(fileOverviewsByBroker).length === 0" class="empty-text">
      暂无概览数据
    </div>

    <div v-else class="file-groups">
      <div v-for="(overviews, broker) in fileOverviewsByBroker" :key="broker" class="file-group">
        <div class="group-header">
          <m-tag color="primary" :small="true">{{ broker }}</m-tag>
          <span class="group-count">{{ overviews.length }} 个文件</span>
        </div>

        <div class="overview-list">
          <div
            v-for="overview in overviews"
            :key="overview.symbol + '_' + overview.interval"
            class="overview-item"
          >
            <div class="overview-main">
              <span class="overview-symbol">{{ overview.symbol }}</span>
              <m-tag color="default" :small="true">{{ overview.interval }}</m-tag>
            </div>
            <div class="overview-details">
              <span>{{ formatNumber(overview.count ?? 0) }} 条</span>
              <span v-if="overview.ranges?.[0]">{{ formatDateRange(overview.ranges) }}</span>
              <span v-else>无数据范围</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-mgr-page {
  padding: 16px;
  padding-bottom: 80px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.download-btn {
  padding: 6px 12px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.download-btn:active {
  background: #0958d9;
}

.empty-text {
  text-align: center;
  padding: 20px;
  color: #999;
}

.file-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-group {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f7f8fa;
  border-bottom: 1px solid #eee;
}

.group-count {
  font-size: 12px;
  color: #999;
}

.overview-list {
  padding: 0;
}

.overview-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f5f5f5;
}

.overview-item:last-child {
  border-bottom: none;
}

.overview-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.overview-symbol {
  font-size: 14px;
  font-weight: 500;
}

.overview-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
</style>
