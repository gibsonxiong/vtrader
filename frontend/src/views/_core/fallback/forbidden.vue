<script lang="ts" setup>
import { Result } from 'ant-design-vue';
defineOptions({ name: 'Fallback403Demo' });
</script>
<template>
  <Result status="403" title="403" sub-title="无权限访问" />
</template>
