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
  <m-popup v-model:open="visible" placement="bottom" title="策略参数" :showOk="false" :showCancel="false" style="maxHeight: 60vh">
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
    <template #footer>
      <button class="footer-btn" @click="handleConfirm">确认并开始回测</button>
    </template>
  </m-popup>
</template>

<style scoped>
.form-container {
  padding: 20px 16px 30px;
}
</style>
