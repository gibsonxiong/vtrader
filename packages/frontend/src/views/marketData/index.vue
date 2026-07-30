<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { brokerManagerApi, marketDataApi } from '@vtrader/backend/api'
import type { ContractData, BrokerConfig } from '@vtrader/backend/api'

interface MarketDataFileOverview { version: 1; brokerType: string; symbol: string; interval: string; ranges: [string, string][]; updatedAt: string; count: number }
interface DownloadRequest { brokerId: string; symbol: string; interval: string; startDate: string; endDate: string; overwrite: boolean }
import { showToast, showLoadingToast, closeToast } from '@/ui/mobile'

// 表单数据
const brokerId = ref('')
const symbol = ref('')
const interval = ref('1d')
const startDate = ref('')
const endDate = ref('')
const overwrite = ref(false)

// 状态
const downloading = ref(false)

// 覆盖确认弹窗
const showOverwriteDialog = ref(false)
const pendingDownload = ref<DownloadRequest | null>(null)

// Broker/Contract 选择相关
const showBrokerPicker = ref(false)
const brokerOptions = ref<{ label: string; value: string; brokerType: string }[]>([])
const contracts = ref<ContractData[]>([])
const selectedBroker = ref<BrokerConfig | null>(null)
const loadingBrokers = ref(false)
const loadingContracts = ref(false)

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

// 获取 broker 列表
async function loadBrokers() {
  loadingBrokers.value = true
  try {
    const res = await brokerManagerApi.getConfigs()
    const data = res.data ?? []
    brokerOptions.value = data.map((b: any) => ({
      label: b.brokerType,
      value: b.id,
      brokerType: b.brokerType,
    }))
  } catch (e: any) {
    console.error('加载 broker 列表失败:', e)
  } finally {
    loadingBrokers.value = false
  }
}

// 选择 broker 后加载合约
async function onBrokerSelected(id: string) {
  brokerId.value = id
  showBrokerPicker.value = false
  loadingContracts.value = true
  contracts.value = []
  try {
    const selected = brokerOptions.value.find(b => b.value === id)
    if (!selected) throw new Error('未找到选中的 broker')
    const res = await marketDataApi.getContracts({ brokerType: selected.brokerType })
    const data = res.data ?? []
    contracts.value = data
  } catch (e: any) {
    console.error('加载合约列表失败:', e)
  } finally {
    loadingContracts.value = false
  }
}

// 选择合约
function selectContract(contract: ContractData) {
  symbol.value = contract.symbol
}

// 下载数据
async function handleDownload() {
  if (!brokerId.value || !symbol.value || !interval.value || !startDate.value || !endDate.value) {
    showToast('请填写完整的下载信息')
    return
  }

  const request: DownloadRequest = {
    brokerId: brokerId.value,
    symbol: symbol.value,
    interval: interval.value,
    startDate: startDate.value,
    endDate: endDate.value,
    overwrite: overwrite.value,
  }

  // 检查是否有已存在的数据（通过概览数据判断）
  const selectedOption = brokerOptions.value.find(b => b.value === brokerId.value)
  const brokerType = selectedOption?.label || ''
  const brokerOverviews = fileOverviewsByBroker.value[brokerType] || []
  const existing = brokerOverviews.find(
    o => o.symbol === symbol.value && o.interval === interval.value
  )

  if (existing && !overwrite.value) {
    pendingDownload.value = request
    showOverwriteDialog.value = true
    return
  }

  doDownload(request)
}

async function doDownload(request: DownloadRequest) {
  showOverwriteDialog.value = false
  downloading.value = true
  showLoadingToast({ message: '正在下载数据...', duration: 0, forbidClick: true })

  try {
    const res = await marketDataApi.download({
      brokerId: request.brokerId,
      symbol: request.symbol,
      interval: request.interval as any,
      startDate: request.startDate,
      endDate: request.endDate,
    })
    closeToast()
    showToast(`下载任务已提交: ${res.data?.message || '成功'}`)
    // 刷新文件列表和概览
    await Promise.all([loadFileOverviews()])
  } catch (e: any) {
    closeToast()
    showToast(e.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

function handleOverwriteConfirm() {
  if (pendingDownload.value) {
    pendingDownload.value.overwrite = true
    doDownload(pendingDownload.value)
    pendingDownload.value = null
  }
}

onMounted(() => {
  loadFileOverviews()
  loadBrokers()
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

// 日期选择器
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 将 Date 对象转换为 YYYY-MM-DD 字符串
function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 将 YYYY-MM-DD 字符串转换为 Date 对象
function parseDateValue(dateStr: string): Date {
  return new Date(dateStr)
}

function onStartDateConfirm(date: Date) {
  startDate.value = formatDateValue(date)
  showStartDatePicker.value = false
}

function onEndDateConfirm(date: Date) {
  endDate.value = formatDateValue(date)
  showEndDatePicker.value = false
}
</script>

<template>
  <div class="data-mgr-page">
    <!-- 下载数据表单 -->
    <div class="section">
      <h3 class="section-title">下载市场数据</h3>

      <!-- Broker 选择 -->
      <div class="form-item">
        <div class="form-label">Broker</div>
        <div class="form-control" @click="showBrokerPicker = true">
          <span :class="{ placeholder: !brokerId }">
            {{ brokerId || '请选择 Broker' }}
          </span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 合约选择 -->
      <div v-if="contracts.length > 0" class="contract-list">
        <div
          v-for="contract in contracts"
          :key="contract.symbol"
          class="contract-item"
          @click="selectContract(contract)"
        >
          <span class="contract-symbol">{{ contract.symbol }}</span>
          <span class="contract-name">{{ contract.name }}</span>
        </div>
      </div>

      <!-- 交易对 -->
      <div class="form-item">
        <div class="form-label">交易对</div>
        <input
          v-model="symbol"
          class="form-input"
          placeholder="如 BTCUSDT"
        />
      </div>

      <!-- 时间周期 -->
      <div class="form-item">
        <div class="form-label">时间周期</div>
        <select v-model="interval" class="form-select">
          <option value="1m">1分钟</option>
          <option value="5m">5分钟</option>
          <option value="15m">15分钟</option>
          <option value="30m">30分钟</option>
          <option value="1h">1小时</option>
          <option value="4h">4小时</option>
          <option value="1d">1天</option>
          <option value="1w">1周</option>
          <option value="1M">1月</option>
        </select>
      </div>

      <!-- 开始日期 -->
      <div class="form-item">
        <div class="form-label">开始日期</div>
        <div class="form-control" @click="showStartDatePicker = true">
          <span :class="{ placeholder: !startDate }">
            {{ startDate || '选择开始日期' }}
          </span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 结束日期 -->
      <div class="form-item">
        <div class="form-label">结束日期</div>
        <div class="form-control" @click="showEndDatePicker = true">
          <span :class="{ placeholder: !endDate }">
            {{ endDate || '选择结束日期' }}
          </span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 下载按钮 -->
      <button class="primary-btn" @click="handleDownload" :disabled="downloading">
        {{ downloading ? '下载中...' : '下载数据' }}
      </button>
    </div>

    <!-- 文件概览列表（按 brokerType 分组） -->
    <div class="section">
      <h3 class="section-title">数据概览</h3>

      <div v-if="loadingOverviews" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

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

    <!-- 覆盖确认弹窗 -->
    <m-modal
      v-model:open="showOverwriteDialog"
      title="数据已存在"
      :footer="[
        { text: '取消', onPress: () => showOverwriteDialog = false },
        { text: '覆盖下载', onPress: handleOverwriteConfirm, style: { color: '#ff4d4f' } },
      ]"
    >
      <div style="padding: 16px; text-align: center;">
        该数据文件已存在，是否覆盖下载？
      </div>
    </m-modal>

    <!-- Broker 选择器 -->
    <m-popup
      v-model:open="showBrokerPicker"
      placement="bottom"
      title="选择 Broker"
      :showOk="false"
      :showCancel="false"
      @cancel="showBrokerPicker = false"
    >
      <div class="broker-picker">
        <div v-if="loadingBrokers" class="loading-container">
          <div class="loading-spinner"></div>
        </div>
        <div v-else>
          <div
            v-for="broker in brokerOptions"
            :key="broker.value"
            class="broker-option"
            :class="{ active: brokerId === broker.value }"
            @click="onBrokerSelected(broker.value)"
          >
            {{ broker.label }}
          </div>
        </div>
      </div>
    </m-popup>

    <!-- 开始日期选择器 -->
    <m-date-picker
      v-model:open="showStartDatePicker"
      :value="startDate ? parseDateValue(startDate) : new Date()"
      mode="date"
      title="选择开始日期"
      @ok="onStartDateConfirm"
    />

    <!-- 结束日期选择器 -->
    <m-date-picker
      v-model:open="showEndDatePicker"
      :value="endDate ? parseDateValue(endDate) : new Date()"
      mode="date"
      title="选择结束日期"
      @ok="onEndDateConfirm"
    />
  </div>
</template>

<style scoped>
.data-mgr-page {
  padding: 16px;
  padding-bottom: 80px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.form-item {
  margin-bottom: 12px;
}

.form-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #1677ff;
}

.form-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.form-control .placeholder {
  color: #999;
}

.form-control .arrow {
  color: #999;
  font-size: 18px;
}

.contract-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 12px;
}

.contract-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.contract-item:last-child {
  border-bottom: none;
}

.contract-item:active {
  background: #f5f5f5;
}

.contract-symbol {
  font-weight: 500;
  font-size: 14px;
}

.contract-name {
  font-size: 12px;
  color: #999;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: #999;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #eee;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.broker-picker {
  max-height: 50vh;
  overflow-y: auto;
}

.broker-option {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  font-size: 14px;
}

.broker-option:active,
.broker-option.active {
  background: #e6f4ff;
  color: #1677ff;
}

.primary-btn {
  width: 100%;
  height: 40px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>
