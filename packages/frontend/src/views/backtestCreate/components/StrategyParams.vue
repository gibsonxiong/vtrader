<script setup lang="ts">
import { reactive, watch } from 'vue'

interface StrategyParamMeta { label: string; default: number; type?: string }
interface StrategyMeta { name: string; label: string; params: Record<string, StrategyParamMeta> }

const props = defineProps<{
  strategyMeta: StrategyMeta | null
  params: Record<string, number>
}>()

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  (e: 'confirm', params: Record<string, number>): void
}>()

const localParams = reactive<Record<string, number>>({})

watch(
  () => [visible.value, props.params] as const,
  ([v]) => {
    if (v) {
      Object.keys(localParams).forEach(k => delete localParams[k])
      Object.assign(localParams, { ...props.params })
    }
  },
  { immediate: true },
)

function handleConfirm() {
  emit('confirm', { ...localParams })
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
            <div v-for="(meta, key) in strategyMeta.params" :key="key" class="form-item">
              <div class="form-label">{{ meta.label }}</div>
              <input
                type="number"
                class="form-input"
                v-model.number="localParams[key]"
                :placeholder="'请输入' + meta.label"
              />
            </div>
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
  margin-bottom: 0;
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
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
.form-input {
  flex: 1;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 14px;
  color: #333;
  outline: none;
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
