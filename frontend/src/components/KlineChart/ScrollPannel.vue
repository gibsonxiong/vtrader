<script lang="ts" setup>
import { Modal, Input, Button } from 'ant-design-vue';
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{ open: boolean }>(), {
  open: false,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'scrollLeft'): void;
  (e: 'scrollRight'): void;
  (e: 'scrollCustom', value: string): void;
}>();

const customDate = ref('');
function isValidDateString(val: string): boolean {
  const s = val.trim();
  if (!s) return false;
  const yyyy = '\\d{4}';
  const MM = '(?:0[1-9]|1[0-2])';
  const dd = '(?:0[1-9]|[12]\\d|3[01])';
  const HH = '(?:[01]\\d|2[0-3])';
  const mm = '[0-5]\\d';

  const reDay = new RegExp(`^${yyyy}-${MM}-${dd}$`);
  const reHour = new RegExp(`^${yyyy}-${MM}-${dd}\\s+${HH}$`);
  const reMinute = new RegExp(`^${yyyy}-${MM}-${dd}\\s+${HH}:${mm}$`);
  return reDay.test(s) || reHour.test(s) || reMinute.test(s);
}

const canJump = computed(() => isValidDateString(customDate.value));

function handleScrollLeft() {
  emit('scrollLeft');
  emit('update:open', false);
}

function handleScrollRight() {
  emit('scrollRight');
  emit('update:open', false);
}

function handleScrollToCustom() {
  if (!canJump.value) return;
  emit('scrollCustom', customDate.value);
  emit('update:open', false);
}

function onVisibleChange(open: boolean) {
  emit('update:open', open);
}
</script>

<template>
  <Modal
    :open="props.open"
    @update:open="onVisibleChange"
    title="滚动"
    :footer="null"
    :destroyOnClose="true"
    :width="360"
  >
    <div class="scroll-panel">
      <div class="custom-row">
        <Input
          v-model:value="customDate"
          placeholder="YYYY-MM-DD HH:mm"
          allow-clear
          class="custom-input"
          :status="customDate && !canJump ? 'error' : ''"
        />
        <Button
          class="scroll-btn custom"
          :disabled="!canJump"
          @click="handleScrollToCustom"
          type="primary"
        >滚动</Button>
      </div>
      <div class="buttons-row">
        <Button class="scroll-btn left" @click="handleScrollLeft" title="滚动到最左边" aria-label="滚动到最左边">←</Button>
        <Button class="scroll-btn right" @click="handleScrollRight" title="滚动到最右边" aria-label="滚动到最右边">→</Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.scroll-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.custom-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.custom-input {
  flex: 1;
}
.buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
