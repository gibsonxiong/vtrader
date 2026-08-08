<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

interface StrategyParamMeta { label: string; default: any; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

const props = defineProps<{
  strategyMeta: StrategyMeta | null
  params: Record<string, any>
}>()

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  (e: 'confirm', params: Record<string, any>): void
}>()

const localParams = reactive<Record<string, any>>({})

// Temporary input values for array/object editors
const arrayInputs = reactive<Record<string, string>>({})
const objectKeyInputs = reactive<Record<string, string>>({})
const objectValueInputs = reactive<Record<string, string>>({})

function getType(key: string): string {
  return props.strategyMeta?.params[key]?.type ?? 'number'
}

function isNumber(key: string) { return getType(key) === 'number' }
function isBoolean(key: string) { return getType(key) === 'boolean' }
function isString(key: string) { return getType(key) === 'string' }
function isArray(key: string) { return getType(key) === 'array' }
function isObject(key: string) { return getType(key) === 'object' }
function isFunction(key: string) { return getType(key) === 'function' }

// Initialize localParams when modal opens
watch(
  () => [visible.value, props.params] as const,
  ([v]) => {
    if (v) {
      Object.keys(localParams).forEach(k => delete localParams[k])
      Object.assign(localParams, JSON.parse(JSON.stringify(props.params)))
      // Initialize array/object inputs
      for (const key of Object.keys(props.params)) {
        arrayInputs[key] = ''
        objectKeyInputs[key] = ''
        objectValueInputs[key] = ''
      }
    }
  },
  { immediate: true },
)

// Array helpers
function ensureArray(key: string) {
  if (!Array.isArray(localParams[key])) {
    localParams[key] = []
  }
}

function addArrayItem(key: string) {
  ensureArray(key)
  const val = arrayInputs[key]?.trim()
  if (val) {
    localParams[key].push(val)
    arrayInputs[key] = ''
  }
}

function removeArrayItem(key: string, index: number) {
  ensureArray(key)
  localParams[key].splice(index, 1)
}

// Object helpers
function ensureObject(key: string) {
  if (typeof localParams[key] !== 'object' || localParams[key] === null || Array.isArray(localParams[key])) {
    localParams[key] = {}
  }
}

function objectEntries(key: string): [string, any][] {
  ensureObject(key)
  return Object.entries(localParams[key])
}

function addObjectEntry(key: string) {
  ensureObject(key)
  const k = objectKeyInputs[key]?.trim()
  if (k && !(k in localParams[key])) {
    localParams[key][k] = objectValueInputs[key]?.trim() ?? ''
    objectKeyInputs[key] = ''
    objectValueInputs[key] = ''
  }
}

function removeObjectEntry(key: string, entryKey: string) {
  ensureObject(key)
  delete localParams[key][entryKey]
}

function handleConfirm() {
  emit('confirm', JSON.parse(JSON.stringify(localParams)))
  visible.value = false
}
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="overlay" @click.self="visible = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">策略参数</span>
        </div>
        <div class="form-container">
          <template v-if="strategyMeta">
            <template v-for="(meta, key) in strategyMeta.params" :key="key">
              <!-- number -->
              <div v-if="isNumber(key)" class="form-item">
                <div class="form-label">{{ meta.label }}</div>
                <input
                  type="number"
                  class="form-input"
                  v-model.number="localParams[key]"
                  :placeholder="'请输入' + meta.label"
                />
              </div>

              <!-- string / function -->
              <div v-else-if="isString(key) || isFunction(key)" class="form-item">
                <div class="form-label">{{ meta.label }}</div>
                <input
                  type="text"
                  class="form-input"
                  v-model="localParams[key]"
                  :placeholder="'请输入' + meta.label"
                />
              </div>

              <!-- boolean -->
              <div v-else-if="isBoolean(key)" class="form-item">
                <div class="form-label">{{ meta.label }}</div>
                <div class="form-control">
                  <label class="switch">
                    <input type="checkbox" v-model="localParams[key]" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>

              <!-- array -->
              <div v-else-if="isArray(key)" class="form-item form-item-array">
                <div class="form-label">{{ meta.label }}</div>
                <div class="form-control-array">
                  <div class="tag-list">
                    <span v-for="(item, idx) in localParams[key]" :key="idx" class="tag">
                      {{ item }}
                      <button class="tag-remove" @click="removeArrayItem(key, idx)">&times;</button>
                    </span>
                  </div>
                  <div class="array-add">
                    <input
                      type="text"
                      class="form-input-sm"
                      v-model="arrayInputs[key]"
                      placeholder="添加项"
                      @keyup.enter="addArrayItem(key)"
                    />
                    <button class="btn-add" @click="addArrayItem(key)">+</button>
                  </div>
                </div>
              </div>

              <!-- object -->
              <div v-else-if="isObject(key)" class="form-item form-item-object">
                <div class="form-label">{{ meta.label }}</div>
                <div class="form-control-object">
                  <div v-for="([entryKey, entryVal], idx) in objectEntries(key)" :key="idx" class="kv-row">
                    <span class="kv-key">{{ entryKey }}</span>
                    <span class="kv-value">{{ entryVal }}</span>
                    <button class="tag-remove" @click="removeObjectEntry(key, entryKey)">&times;</button>
                  </div>
                  <div class="kv-add">
                    <input
                      type="text"
                      class="form-input-sm"
                      v-model="objectKeyInputs[key]"
                      placeholder="key"
                    />
                    <input
                      type="text"
                      class="form-input-sm"
                      v-model="objectValueInputs[key]"
                      placeholder="value"
                      @keyup.enter="addObjectEntry(key)"
                    />
                    <button class="btn-add" @click="addObjectEntry(key)">+</button>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="visible = false">取消</button>
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
  text-align: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.form-container {
  overflow-y: auto;
  flex: 1;
  padding: 0;
}
.form-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.form-item.form-item-array,
.form-item.form-item-object {
  flex-direction: column;
  align-items: stretch;
}
.form-item:last-child {
  border-bottom: none;
}
.form-label {
  font-size: 14px;
  color: #333;
  width: 100px;
  flex-shrink: 0;
}
.form-item-array .form-label,
.form-item-object .form-label {
  margin-bottom: 8px;
}
.form-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.form-input {
  flex: 1;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 14px;
  color: #333;
  outline: none;
}
.form-input-sm {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  color: #333;
  outline: none;
  width: 80px;
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

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #1677ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.tag-remove {
  background: none;
  border: none;
  color: #1677ff;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* Array controls */
.form-control-array {
  flex: 1;
}
.array-add {
  display: flex;
  align-items: center;
  gap: 6px;
}
.array-add .form-input-sm {
  flex: 1;
  width: auto;
}
.btn-add {
  width: 28px;
  height: 28px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Object controls */
.form-control-object {
  flex: 1;
}
.kv-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px;
}
.kv-key {
  color: #1677ff;
  font-weight: 500;
  min-width: 60px;
}
.kv-value {
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kv-add {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kv-add .form-input-sm {
  flex: 1;
  width: auto;
}

.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-shrink: 0;
}
.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}
.btn-cancel {
  background: #f5f5f5;
  color: #666;
}
.btn-confirm {
  background: #1677ff;
  color: #fff;
}
.btn-confirm:active {
  background: #0958d9;
}
</style>
