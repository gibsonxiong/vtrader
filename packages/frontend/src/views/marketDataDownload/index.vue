<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { marketDataApi } from '@vtrader/backend/api'
import type { BrokerType, ContractData, Interval, DownloadJobStatus } from '@vtrader/backend/api'
import { useContractStore } from '@/stores/contract'
import { showToast, showLoadingToast, closeToast } from '@/ui/mobile'
import { formatBrokerType } from '@/utils/broker'
import NavBar from '@/components/NavBar.vue'
import PickerInput from '@/components/PickerInput.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import Button from '@/components/Button.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

const router = useRouter()

// 表单数据
const brokerType = ref('')
const symbols = ref<string[]>([])
const intervals = ref<string[]>([])
const startDate = ref<Dayjs>()
const endDate = ref<Dayjs>()

// 状态
const downloading = ref(false)
const currentJobId = ref<string | null>(null)
const downloadProgress = ref(0)
const downloadStatus = ref<string>('')
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 合约 Store
const contractStore = useContractStore()

// Broker/Contract 选择相关
const brokerOptions = ref<{ label: string; value: string }[]>([])
const contracts = ref<ContractData[]>([])
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
watch(() => brokerType.value, async (type) => {
  if (!type) return
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
})

// 合约数据转换
const contractData = computed(() =>
  contracts.value.map((c) => ({ label: c.symbol, value: c.symbol }))
)

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

// 下载数据
async function doDownload() {
  if (!brokerType.value || symbols.value.length === 0 || intervals.value.length === 0 || !startDate.value || !endDate.value) {
    showToast('请填写完整的下载信息')
    return
  }

  downloading.value = true
  downloadProgress.value = 0
  downloadStatus.value = '正在提交任务...'

  try {
    const res = await marketDataApi.batchDownload({
      brokerType: brokerType.value as BrokerType,
      symbols: symbols.value,
      intervals: intervals.value as Interval[],
      startDate: startDate.value!.format('YYYY-MM-DD'),
      endDate: endDate.value!.format('YYYY-MM-DD'),
    })

    const jobId = res.data?.jobId
    if (!jobId) {
      throw new Error('未获取到任务ID')
    }

    currentJobId.value = jobId
    downloadStatus.value = '任务已提交，等待处理...'

    // 开始轮询进度
    startPolling(jobId)
  } catch (e: any) {
    downloading.value = false
    downloadStatus.value = ''
    showToast(e.message || '提交任务失败')
  }
}

// 轮询任务进度
function startPolling(jobId: string) {
  // 清除之前的定时器
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
  }

  pollTimer.value = setInterval(async () => {
    try {
      const res = await marketDataApi.getDownloadStatus(jobId)
      const status: DownloadJobStatus = res.data!

      downloadProgress.value = status.progress || 0

      if (status.status === 'completed') {
        // 完成
        stopPolling()
        downloading.value = false
        downloadStatus.value = '下载完成'

        const totalBars = status.result?.totalBars || 0
        showToast(`下载完成！共 ${totalBars} 条数据`)

        // 延迟跳转
        setTimeout(() => {
          router.push({ name: 'data' })
        }, 1500)
      } else if (status.status === 'failed') {
        // 失败
        stopPolling()
        downloading.value = false
        downloadStatus.value = ''
        showToast(`下载失败: ${status.failedReason || '未知错误'}`)
      } else if (status.status === 'active') {
        // 进行中
        downloadStatus.value = `正在下载... ${status.progress || 0}%`
      } else if (status.status === 'waiting') {
        // 等待中
        downloadStatus.value = '等待处理...'
      }
    } catch (e: any) {
      console.error('轮询失败:', e)
    }
  }, 1000) // 每秒轮询一次
}

// 停止轮询
function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

onMounted(() => {
  loadBrokers()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="download-page">
    <NavBar title="数据下载" />

    <div class="form-container">
      <CellGroup bordered>
        <!-- BrokerType 选择 -->
        <Cell title="BrokerType">
          <PickerInput v-model="brokerType" :data="brokerOptions" title="选择 BrokerType" placeholder="请选择 BrokerType" />
        </Cell>

        <!-- 交易对选择 -->
        <Cell title="交易对">
          <PickerInput
            v-model="symbols"
            :data="contractData"
            title="选择交易对"
            placeholder="请选择交易对"
            :multiple="true"
            :loading="loadingContracts"
            emptyText="请先选择 BrokerType"
          />
        </Cell>

        <!-- 时间周期选择 -->
        <Cell title="时间周期">
          <PickerInput
            v-model="intervals"
            :data="intervalOptions"
            title="选择时间周期"
            placeholder="请选择时间周期"
            :multiple="true"
          />
        </Cell>

        <!-- 开始日期 -->
        <Cell title="开始日期">
          <DatePickerInput v-model="startDate" title="选择开始日期" placeholder="选择开始日期" />
        </Cell>

        <!-- 结束日期 -->
        <Cell title="结束日期">
          <DatePickerInput v-model="endDate" title="选择结束日期" placeholder="选择结束日期" />
        </Cell>
      </CellGroup>

      <!-- 下载按钮 -->
      <Button :loading="downloading" :mt="8" @click="doDownload">
        {{ downloading ? '下载中...' : '下载数据' }}
      </Button>

      <!-- 进度展示 -->
      <div v-if="downloading || downloadStatus" class="progress-container">
        <div class="progress-status">{{ downloadStatus }}</div>
        <div v-if="downloading" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${downloadProgress}%` }"></div>
        </div>
        <div v-if="downloading" class="progress-percent">{{ downloadProgress }}%</div>
      </div>
    </div>

    </div>
</template>

<style scoped>
.download-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-container {
  background: #fff;
  padding: 16px;
}

.progress-container {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.progress-status {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #4096ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 12px;
  color: #1677ff;
  margin-top: 4px;
  text-align: right;
}
</style>
