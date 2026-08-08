<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const props = defineProps<{
  modelValue: Dayjs
  title: string
  placeholder: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Dayjs): void
}>()

const showPicker = ref(false)

function onConfirm(date: Date) {
  emit('update:modelValue', dayjs(date))
  showPicker.value = false
}
</script>

<template>
  <div class="form-control" @click="showPicker = true" :class="{focus: showPicker}">
    <span :class="{ placeholder: !modelValue }">{{ modelValue ? modelValue.format('YYYY-MM-DD') : placeholder }}</span>
    <i class="iconfont icon-down"></i>
  </div>

  <m-date-picker
    v-model:open="showPicker"
    :value="modelValue ? modelValue.toDate() : new Date()"
    mode="date"
    :title="title"
    @ok="onConfirm"
  />
</template>

<style scoped>
</style>
