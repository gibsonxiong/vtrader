<script setup lang="ts">
import { ref, computed } from 'vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const props = withDefaults(defineProps<{
  modelValue: string | string[]
  data: { label: string; value: string }[]
  title: string
  placeholder?: string
  multiple?: boolean
  loading?: boolean
  emptyText?: string
}>(), {
  multiple: false,
  loading: false,
  emptyText: '暂无数据',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void
}>()

const showPicker = ref(false)

// 多选暂存
const draftSelection = ref<string[]>([])

const displayLabel = computed(() => {
  if (props.multiple) return ''
  return props.data.find((item) => item.value === props.modelValue)?.label ?? ''
})

const selectedTags = computed(() => {
  if (!props.multiple) return []
  const values = props.modelValue as string[]
  return props.data.filter((item) => values.includes(item.value))
})

// 单选
function onSingleUpdate(value: string[]) {
  emit('update:modelValue', value[0] ?? '')
  showPicker.value = false
}

// 多选
function openMultiPicker() {
  draftSelection.value = [...(props.modelValue as string[])]
  showPicker.value = true
}

function toggleItem(value: string) {
  const idx = draftSelection.value.indexOf(value)
  if (idx === -1) {
    draftSelection.value.push(value)
  } else {
    draftSelection.value.splice(idx, 1)
  }
}

function confirmSelection() {
  emit('update:modelValue', [...draftSelection.value])
  showPicker.value = false
}
</script>

<template>
  <!-- 展示区域 -->
  <div
    class="form-control"
    :class="{ focus: showPicker }"
    @click="multiple ? openMultiPicker() : showPicker = true"
  >
    <template v-if="multiple">
      <div v-if="selectedTags.length === 0" class="placeholder">{{ placeholder }}</div>
      <div v-else class="tags-wrap">
        <span v-for="tag in selectedTags" :key="tag.value" class="tag">{{ tag.label }}</span>
      </div>
    </template>
    <span v-else :class="{ placeholder: !modelValue }">{{ displayLabel || placeholder }}</span>
    <i class="iconfont icon-down"></i>
  </div>

  <!-- 单选：m-picker -->
  <m-picker
    v-if="!multiple"
    v-model:open="showPicker"
    :value="modelValue ? [modelValue] : []"
    :data="[data]"
    :cols="1"
    :cascade="false"
    :title="title"
    @update:value="onSingleUpdate"
  />

  <!-- 多选：自定义 m-popup -->
  <m-popup
    v-else
    v-model:open="showPicker"
    placement="bottom"
    :title="title"
    :showOk="true"
    :showCancel="true"
    @ok="confirmSelection"
  >
    <div class="multi-picker">
      <LoadingSpinner v-if="loading" />
      <div v-else-if="data.length === 0" class="empty-text">
        <div class="empty-icon"></div>
        <span>{{ emptyText }}</span>
      </div>
      <div v-else>
        <div
          v-for="item in data"
          :key="item.value"
          class="multi-option"
          :class="{ selected: draftSelection.includes(item.value) }"
          @click="toggleItem(item.value)"
        >
          <span class="multi-option-label">{{ item.label }}</span>
          <i class="iconfont icon-check" v-if="draftSelection.includes(item.value)"></i>
        </div>
      </div>
    </div>
    <!-- <template #footer>
      <button class="footer-btn" @click="confirmSelection">确定</button>
    </template> -->
  </m-popup>
</template>

<style scoped>
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-block;
  padding: 0 6px;
  background: #e6f4ff;
  color: #1677ff;
  border-radius: 3px;
  font-size: 12px;
  line-height: 20px;
}

.multi-picker {
  max-height: 50vh;
  overflow-y: auto;
}

.multi-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.multi-option:active {
  background: #f5f5f5;
}

.multi-option .iconfont {
  color: #1677ff;
  font-size: 20px;
}

.multi-option-label {
  font-size: 15px;
  color: #333;
}

.empty-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  gap: 8px;
}

.empty-text .iconfont {
  font-size: 40px;
  color: #ccc;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border: 2px solid #ddd;
  border-radius: 12px;
  position: relative;
}

.empty-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 2px;
  background: #ddd;
}

.footer-btn {
  width: 100%;
  height: 40px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}
</style>
