<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast } from '@/ui/mobile'
import { brokerConfigApi } from '@vtrader/backend/api'
import type { BrokerConfig, BrokerType } from '@vtrader/backend/api'
import { formatBrokerType } from '@/utils/broker'

const brokerTypes: { key: BrokerType; label: string }[] = [
  { key: 'BINANCE_LINEAR', label: formatBrokerType('BINANCE_LINEAR') },
  { key: 'BINANCE_LINEAR_TESTNET', label: formatBrokerType('BINANCE_LINEAR_TESTNET') },
]

const activeTab = ref<BrokerType>('BINANCE_LINEAR')
const brokers = ref<BrokerConfig[]>([])
const loading = ref(false)

// 表单相关
const showForm = ref(false)
const isEdit = ref(false)
const editingBroker = ref<BrokerConfig | null>(null)
const formName = ref('')
const formBrokerType = ref<BrokerType>('BINANCE_LINEAR')
const formApiKey = ref('')
const formApiSecret = ref('')
const showTypePicker = ref(false)

// 删除确认
const showDeleteModal = ref(false)
const deletingBroker = ref<BrokerConfig | null>(null)

const typeOptions = brokerTypes.map(t => ({ label: t.label, value: t.key }))

const filteredBrokers = computed(() =>
  brokers.value.filter(b => b.brokerType === activeTab.value)
)

const typeLabel = computed(() =>
  brokerTypes.find(t => t.key === formBrokerType.value)?.label ?? ''
)

async function fetchBrokers() {
  loading.value = true
  try {
    const res = await brokerConfigApi.list()
    brokers.value = res.data ?? []
  } catch {
    showToast('获取经纪商列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchBrokers)

function openCreateForm() {
  isEdit.value = false
  editingBroker.value = null
  formName.value = ''
  formBrokerType.value = activeTab.value
  formApiKey.value = ''
  formApiSecret.value = ''
  showForm.value = true
}

function openEditForm(broker: BrokerConfig) {
  isEdit.value = true
  editingBroker.value = broker
  formName.value = broker.name
  formBrokerType.value = broker.brokerType
  formApiKey.value = ''
  formApiSecret.value = ''
  showForm.value = true
}

function onTypePickerUpdate(value: string[]) {
  formBrokerType.value = (value[0] as BrokerType) ?? 'BINANCE_LINEAR'
  showTypePicker.value = false
}

async function handleFormSubmit() {
  if (!formName.value.trim()) {
    showToast('请输入经纪商名称')
    return
  }

  if (isEdit.value && editingBroker.value) {
    try {
      await brokerConfigApi.update({ id: editingBroker.value.id, name: formName.value.trim() })
      showToast('修改成功')
      showForm.value = false
      fetchBrokers()
    } catch {
      showToast('修改失败')
    }
  } else {
    if (!formApiKey.value.trim()) {
      showToast('请输入 API Key')
      return
    }
    if (!formApiSecret.value.trim()) {
      showToast('请输入 API Secret')
      return
    }
    try {
      await brokerConfigApi.create({
        name: formName.value.trim(),
        brokerType: formBrokerType.value,
        apiKey: formApiKey.value.trim(),
        apiSecret: formApiSecret.value.trim(),
      })
      showToast('添加成功')
      showForm.value = false
      fetchBrokers()
    } catch {
      showToast('添加失败')
    }
  }
}

function confirmDelete(broker: BrokerConfig) {
  deletingBroker.value = broker
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deletingBroker.value) return
  try {
    await brokerConfigApi.remove({ id: deletingBroker.value.id })
    showToast('删除成功')
    showDeleteModal.value = false
    deletingBroker.value = null
    fetchBrokers()
  } catch {
    showToast('删除失败')
  }
}
</script>

<template>
  <div class="page broker-page">
    <!-- 顶部标题栏 -->
    <div class="header">
      <h2>经纪商管理</h2>
      <button class="add-btn" @click="openCreateForm">+ 新增</button>
    </div>

    <!-- Tab 栏 -->
    <div class="tabs">
      <div
        v-for="t in brokerTypes"
        :key="t.key"
        class="tab-item"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </div>
    </div>

    <!-- 列表 -->
    <div class="list" v-if="!loading">
      <div v-if="filteredBrokers.length === 0" class="empty">暂无数据</div>
      <div
        v-for="broker in filteredBrokers"
        :key="broker.id"
        class="broker-card"
      >
        <div class="broker-info" @click="openEditForm(broker)">
          <div class="broker-name">{{ broker.name }}</div>
          <div class="broker-type-tag">{{ brokerTypes.find(t => t.key === broker.brokerType)?.label }}</div>
        </div>
        <button class="delete-btn" @click="confirmDelete(broker)">删除</button>
      </div>
    </div>

    <div v-else class="loading-container">
      <div class="loading-spinner"></div>
    </div>

    <!-- 新增/编辑 Popup -->
    <m-popup
      v-model:open="showForm"
      placement="bottom"
      :title="isEdit ? '编辑经纪商' : '新增经纪商'"
      :showOk="false"
      :showCancel="false"
    >
      <div class="form-container">
        <form @submit.prevent="handleFormSubmit">
          <div class="form-item">
            <div class="form-label">经纪商名称</div>
            <input
              type="text"
              class="form-input"
              v-model="formName"
              placeholder="请输入经纪商名称"
            />
          </div>

          <!-- 新增模式：显示类型、API Key、API Secret -->
          <template v-if="!isEdit">
            <div class="form-item" @click="showTypePicker = true">
              <div class="form-label">经纪商类型</div>
              <div class="form-control">
                <span>{{ typeLabel || '请选择经纪商类型' }}</span>
                <span class="arrow">›</span>
              </div>
            </div>

            <div class="form-item">
              <div class="form-label">API Key</div>
              <input
                type="text"
                class="form-input"
                v-model="formApiKey"
                placeholder="请输入 API Key"
              />
            </div>

            <div class="form-item">
              <div class="form-label">API Secret</div>
              <input
                type="password"
                class="form-input"
                v-model="formApiSecret"
                placeholder="请输入 API Secret"
              />
            </div>
          </template>

          <div class="form-actions">
            <button type="submit" class="primary-btn">{{ isEdit ? '保存' : '添加' }}</button>
          </div>
        </form>

        <!-- 类型选择器 -->
        <m-picker
          v-model:open="showTypePicker"
          :value="[formBrokerType]"
          :data="[typeOptions]"
          :cols="1"
          :cascade="false"
          title="选择经纪商类型"
          @update:value="onTypePickerUpdate"
        />
      </div>
    </m-popup>

    <!-- 删除确认 Modal -->
    <m-modal
      v-model:open="showDeleteModal"
      title="确认删除"
      :footer="[
        { text: '取消', onPress: () => showDeleteModal = false },
        { text: '删除', onPress: handleDelete, style: { color: '#ef4444' } },
      ]"
    >
      <div style="padding: 16px; text-align: center;">
        确定要删除该经纪商配置吗？
      </div>
    </m-modal>
  </div>
</template>

<style scoped>
.broker-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
}

.header h2 {
  font-size: 18px;
  margin: 0;
}

.add-btn {
  padding: 6px 14px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.add-btn:active {
  background: #0958d9;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #1677ff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: #1677ff;
  border-radius: 1px;
}

.list {
  padding: 12px 16px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

.broker-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.broker-info {
  flex: 1;
  cursor: pointer;
}

.broker-name {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin-bottom: 4px;
}

.broker-type-tag {
  display: inline-block;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.delete-btn {
  padding: 6px 12px;
  background: #fff;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 12px;
}

.delete-btn:active {
  background: #fef2f2;
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

.form-container {
  padding: 20px 16px 30px;
}

.form-item {
  margin-bottom: 12px;
}

.form-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus {
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

.form-control .arrow {
  color: #999;
  font-size: 18px;
}

.form-actions {
  padding: 20px 0 0;
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

.primary-btn:active {
  background: #0958d9;
}
</style>
