<script lang="ts" setup>
import { Button, Result } from 'ant-design-vue';
import { useRouter } from 'vue-router';
const router = useRouter();
defineOptions({ name: 'Fallback404Demo' });
</script>
<template>
  <Result status="404" title="404" sub-title="页面不存在">
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
