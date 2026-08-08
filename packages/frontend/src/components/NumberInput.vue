<script setup lang="ts">
defineProps<{
  modelValue: number
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}

function onClear() {
  emit('update:modelValue', 0)
}
</script>

<template>
  <span class="input-wrap">
    <input
      type="number"
      class="input"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <button v-if="clearable && modelValue !== 0" class="clear-btn" @click="onClear">&times;</button>
  </span>
</template>

<style scoped>
.input-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}
.input {
  flex: 1;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 14px;
  color: #333;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.input:focus {
  border-color: #1677ff;
}
.input:disabled {
  background: #f5f5f5;
  color: #999;
}
.clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
</style>