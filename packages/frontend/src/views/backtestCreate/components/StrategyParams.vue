<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Input from '@/components/Input.vue'
import NumberInput from '@/components/NumberInput.vue'
import CellGroup from '@/components/CellGroup.vue'
import Cell from '@/components/Cell.vue'

interface StrategyParamMeta { label: string; default: any; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

const STORAGE_KEY = 'backtest_strategy_params'

const props = defineProps<{
  strategyMeta: StrategyMeta | null
  params: Record<string, any>
}>()

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  (e: 'confirm', params: Record<string, any>): void
}>()

const localParams = reactive<Record<string, any>>({})
const remember = ref(true)

function getType(key: string): string {
  return props.strategyMeta?.params[key]?.type ?? 'number'
}

function isNumber(key: string) { return getType(key) === 'number' }
function isBoolean(key: string) { return getType(key) === 'boolean' }

function getStorageKey() {
  const name = props.strategyMeta?.name ?? 'default'
  return `${STORAGE_KEY}_${name}`
}

function loadSavedParams(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(getStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveParams(data: Record<string, any>) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data))
  } catch {
    // ignore
  }
}

function initParams(source: Record<string, any>) {
  Object.keys(localParams).forEach(k => delete localParams[k])
  Object.assign(localParams, JSON.parse(JSON.stringify(source)))
}

// Initialize localParams when modal opens
watch(
  () => [visible.value, props.params] as const,
  ([v]) => {
    if (v) {
      const saved = loadSavedParams()
      initParams(saved ?? props.params)
    }
  },
  { immediate: true },
)

function handleReset() {
  localStorage.removeItem(getStorageKey())
  initParams(props.params)
}

function handleConfirm() {
  const data = JSON.parse(JSON.stringify(localParams))
  if (remember.value) {
    saveParams(data)
  }
  emit('confirm', data)
  visible.value = false
}
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="overlay" @click.self="visible = false">
      <div class="modal">
        <div class="modal-header">
          <button class="btn-reset" @click="handleReset">重置</button>
          <span class="modal-title">策略参数</span>
          <span class="header-spacer"></span>
        </div>
        <div class="form-container">
          <template v-if="strategyMeta">
            <CellGroup bordered>
              <template v-for="(meta, key) in strategyMeta.params" :key="key">
                <!-- number -->
                <Cell v-if="isNumber(key)" :title="meta.label">
                  <NumberInput
                    v-model="localParams[key]"
                    :placeholder="'请输入' + meta.label"
                  />
                </Cell>

                <!-- string -->
                <Cell v-else-if="!isBoolean(key)" :title="meta.label">
                  <Input
                    v-model="localParams[key]"
                    :placeholder="'请输入' + meta.label"
                  />
                </Cell>

                <!-- boolean -->
                <Cell v-else :title="meta.label">
                    <label class="switch">
                      <input type="checkbox" v-model="localParams[key]" />
                      <span class="switch-slider"></span>
                    </label>
                </Cell>
              </template>
            </CellGroup>
          </template>
        </div>
        <div class="modal-footer">
          <label class="remember-label">
            <input type="checkbox" v-model="remember" />
            <span>记住参数</span>
          </label>
          <button class="btn-confirm" @click="handleConfirm">确认并开始回测</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: calc(100% - 48px);
  max-width: 360px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  padding: 20px 20px 16px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.btn-reset {
  background: none;
  border: none;
  color: #1677ff;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}
.header-spacer {
  width: 36px;
}
.form-container {
  background: #fff;
  overflow-y: auto;
  flex: 1;
  padding: 0;
}
.form-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}
.switch input {
  display: none;
}
.switch-slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  transition: background 0.2s;
}
.switch-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch input:checked + .switch-slider {
  background: #1677ff;
}
.switch input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-shrink: 0;
}
.remember-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
}
.remember-label input {
  margin: 0;
}
.btn-confirm {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  background: #1677ff;
  color: #fff;
}
.btn-confirm:active {
  background: #0958d9;
}
</style>
