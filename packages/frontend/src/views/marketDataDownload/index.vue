<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { brokerConfigApi, marketDataApi } from '@vtrader/backend/api'
import type { BrokerType, ContractData, Interval } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'

import { showToast, showLoadingToast, closeToast } from '@/ui/mobile'
import { formatBrokerType } from '@/utils/broker'

const router = useRouter()

// 表单数据
const brokerType = ref('')
const symbols = ref<string[]>([])
const intervals = ref<string[]>([])
const startDate = ref('')
const endDate = ref('')

// 状态
const downloading = ref(false)

// 合约 Store
const contractStore = useContractStore()

// Broker/Contract 选择相关
const showBrokerPicker = ref(false)
const showContractPicker = ref(false)
const showIntervalPicker = ref(false)
const brokerOptions = ref<{ label: string; value: string }[]>([])
const contracts = ref<ContractData[]>([])
const loadingBrokers = ref(false)
const loadingContracts = ref(false)

// 获取 broker 列表
async function loadBrokers() {
    brokerOptions.value = [
      {
        label: formatBrokerType('BINANCE_LINEAR'),
        value: 'BINANCE_LINEAR',
      },
      {
        label: formatBrokerType('BINANCE_LINEAR_TESTNET'),
        value: 'BINANCE_LINEAR_TESTNET',
      },
    ]
}

// 选择 broker 后加载合约
async function onBrokerSelected(type: string) {
  brokerType.value = type
  showBrokerPicker.value = false
  loadingContracts.value = true
  contracts.value = []
  try {
    const data = await contractStore.fetchContracts(type as any)
    contracts.value = data
  } catch (e: any) {
    console.error('加载合约列表失败:', e)
  } finally {
    loadingContracts.value = false
  }
}

// 切换合约选择
function toggleContract(contract: ContractData) {
  const idx = symbols.value.indexOf(contract.symbol)
  if (idx === -1) {
    symbols.value.push(contract.symbol)
  } else {
    symbols.value.splice(idx, 1)
  }
}

// 确认合约选择
function confirmContractSelection() {
  showContractPicker.value = false
}

// 时间周期选项
const intervalOptions = [
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '4小时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
  { label: '1月', value: '1M' },
]

// 切换时间周期选择
function toggleInterval(value: string) {
  const idx = intervals.value.indexOf(value)
  if (idx === -1) {
    intervals.value.push(value)
  } else {
    intervals.value.splice(idx, 1)
  }
}

// 确认时间周期选择
function confirmIntervalSelection() {
  showIntervalPicker.value = false
}

// 下载数据


async function doDownload() {
    if (!brokerType.value || symbols.value.length === 0 || intervals.value.length === 0 || !startDate.value || !endDate.value) {
    showToast('请填写完整的下载信息')
    return
  }

  downloading.value = true
  showLoadingToast({ message: '正在下载数据...', duration: 0, forbidClick: true })

  try {
    const res = await marketDataApi.batchDownload({
      brokerType: brokerType.value as BrokerType,
      symbols: symbols.value,
      intervals: intervals.value as Interval[],
      startDate: startDate.value,
      endDate: endDate.value,
    })
    closeToast()
    showToast(`下载任务已提交: ${res.data?.message || '成功'}`)
    router.push({ name: 'data' })
  } catch (e: any) {
    closeToast()
    showToast(e.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  loadBrokers()
})

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
  <div class="download-page">
    <div class="nav-bar">
      <button class="nav-back" @click="router.back()">← 返回</button>
      <span class="nav-title">下载市场数据</span>
      <span class="nav-right"></span>
    </div>

    <div class="form-container">
      <!-- BrokerType 选择 -->
      <div class="form-item">
        <div class="form-label">BrokerType</div>
        <div class="form-control" @click="showBrokerPicker = true">
          <span :class="{ placeholder: !brokerType }">
            {{ brokerType || '请选择 BrokerType' }}
          </span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 交易对选择 -->
      <div class="form-item">
        <div class="form-label">交易对</div>
        <div class="form-control" @click="showContractPicker = true">
          <span :class="{ placeholder: symbols.length === 0 }">
            {{ symbols.length > 0 ? `已选 ${symbols.length} 个交易对` : '请选择交易对' }}
          </span>
          <span class="arrow">›</span>
        </div>
        <div v-if="symbols.length > 0" class="selected-tags">
          <span v-for="s in symbols" :key="s" class="tag">{{ s }}</span>
        </div>
      </div>

      <!-- 时间周期选择 -->
      <div class="form-item">
        <div class="form-label">时间周期</div>
        <div class="form-control" @click="showIntervalPicker = true">
          <span :class="{ placeholder: intervals.length === 0 }">
            {{ intervals.length > 0 ? `已选 ${intervals.length} 个周期` : '请选择时间周期' }}
          </span>
          <span class="arrow">›</span>
        </div>
        <div v-if="intervals.length > 0" class="selected-tags">
          <span v-for="i in intervals" :key="i" class="tag">{{ i }}</span>
        </div>
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
      <button class="primary-btn" @click="doDownload" :disabled="downloading">
        {{ downloading ? '下载中...' : '下载数据' }}
      </button>
    </div>

    <!-- BrokerType 选择器 -->
    <m-popup
      v-model:open="showBrokerPicker"
      placement="bottom"
      title="选择 BrokerType"
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
            :class="{ active: brokerType === broker.value }"
            @click="onBrokerSelected(broker.value)"
          >
            {{ broker.label }}
          </div>
        </div>
      </div>
    </m-popup>

    <!-- 合约多选弹窗 -->
    <m-popup
      v-model:open="showContractPicker"
      placement="bottom"
      title="选择交易对"
      @ok="confirmContractSelection"
      @cancel="showContractPicker = false"
    >
      <div class="contract-picker">
        <div v-if="loadingContracts" class="loading-container">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="contracts.length === 0" class="empty-text">
          请先选择 BrokerType
        </div>
        <div v-else>
          <div
            v-for="contract in contracts"
            :key="contract.symbol"
            class="contract-option"
            @click="toggleContract(contract)"
          >
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="symbols.includes(contract.symbol)"
                @click.stop
                @change="toggleContract(contract)"
              />
              <span class="contract-symbol">{{ contract.symbol }}</span>
              <span v-if="contract.name" class="contract-name">{{ contract.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </m-popup>

    <!-- 时间周期多选弹窗 -->
    <m-popup
      v-model:open="showIntervalPicker"
      placement="bottom"
      title="选择时间周期"
      @ok="confirmIntervalSelection"
      @cancel="showIntervalPicker = false"
    >
      <div class="interval-picker">
        <div
          v-for="option in intervalOptions"
          :key="option.value"
          class="interval-option"
          @click="toggleInterval(option.value)"
        >
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="intervals.includes(option.value)"
              @click.stop
              @change="toggleInterval(option.value)"
            />
            <span>{{ option.label }}</span>
          </label>
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
.download-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
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
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 50px;
}

.form-container {
  padding: 16px;
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

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e6f4ff;
  color: #1677ff;
  border-radius: 4px;
  font-size: 12px;
}

.contract-picker {
  max-height: 50vh;
  overflow-y: auto;
}

.contract-option {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.contract-option:active {
  background: #f5f5f5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.contract-symbol {
  font-weight: 500;
  font-size: 14px;
}

.contract-name {
  font-size: 12px;
  color: #999;
}

.empty-text {
  text-align: center;
  padding: 20px;
  color: #999;
}

.interval-picker {
  max-height: 50vh;
  overflow-y: auto;
}

.interval-option {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.interval-option:active {
  background: #f5f5f5;
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
  margin-top: 8px;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
