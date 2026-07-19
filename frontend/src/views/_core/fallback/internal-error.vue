<script lang="ts" setup>
import { Result } from 'ant-design-vue';
defineOptions({ name: 'Fallback500Demo' });
</script>
<template>
  <Result status="500" title="500" sub-title="服务器错误" />
</template>
