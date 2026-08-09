<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast } from '@/ui/mobile'
import { brokerConfigApi } from '@vtrader/backend/api'
import type { BrokerModel, BrokerType } from '@vtrader/backend/api'
import { formatBrokerType } from '@/utils/broker'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import NavBar from '@/components/NavBar.vue'
import Input from '@/components/Input.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import PickerInput from '@/components/PickerInput.vue'
import Button from '@/components/Button.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

const brokerTypes: { key: BrokerType; label: string }[] = [
  { key: 'BINANCE_LINEAR', label: formatBrokerType('BINANCE_LINEAR') },
  { key: 'BINANCE_LINEAR_TESTNET', label: formatBrokerType('BINANCE_LINEAR_TESTNET') },
]

const activeTab = ref<BrokerType>('BINANCE_LINEAR')
const brokers = ref<BrokerModel[]>([])
const loading = ref(false)

// 表单相关
const showForm = ref(false)
const isEdit = ref(false)
const editingBroker = ref<BrokerModel | null>(null)
const formName = ref('')
const formBrokerType = ref<BrokerType>('BINANCE_LINEAR')
const formApiKey = ref('')
const formApiSecret = ref('')

// 删除确认
const showDeleteModal = ref(false)
const deletingBroker = ref<BrokerModel | null>(null)

const typeOptions = brokerTypes.map(t => ({ label: t.label, value: t.key }))

const filteredBrokers = computed(() =>
  brokers.value.filter(b => b.brokerType === activeTab.value)
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

function openEditForm(broker: BrokerModel) {
  isEdit.value = true
  editingBroker.value = broker
  formName.value = broker.name
  formBrokerType.value = broker.brokerType
  formApiKey.value = ''
  formApiSecret.value = ''
  showForm.value = true
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

function confirmDelete(broker: BrokerModel) {
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
    <NavBar title="经纪商管理">
      <template #right>
        <button class="add-btn" @click="openCreateForm">+ 新增</button>
      </template>
    </NavBar>

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

    <LoadingSpinner v-else />

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
          <CellGroup bordered>
            <Cell title="经纪商名称">
              <Input
                v-model="formName"
                placeholder="请输入经纪商名称"
              />
            </Cell>

            <!-- 新增模式：显示类型、API Key、API Secret -->
            <template v-if="!isEdit">
              <Cell title="经纪商类型">
                <PickerInput v-model="formBrokerType" :data="typeOptions" title="选择经纪商类型" placeholder="请选择经纪商类型" />
              </Cell>

              <Cell title="API Key">
                <Input
                  v-model="formApiKey"
                  placeholder="请输入 API Key"
                />
              </Cell>

              <Cell title="API Secret">
                <PasswordInput
                  v-model="formApiSecret"
                  placeholder="请输入 API Secret"
                />
              </Cell>
            </template>
          </CellGroup>

        </form>
      </div>
      <template #footer>
        <Button @click="handleFormSubmit">{{ isEdit ? '更新' : '保存' }}</Button>
      </template>
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

.form-container {
  background: #fff;
  padding: 20px 16px 30px;
}

.form-actions {
  padding: 20px 0 0;
}
</style>
