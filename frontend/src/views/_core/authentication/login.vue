<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { Form, Input, Button, Card, message } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const formRef = ref();
const formState = reactive({ username: 'vben', password: '123456' });

async function handleFinish() {
  try {
    await authStore.authLogin({ username: formState.username, password: formState.password });
  } catch {
    message.error('登录失败');
  }
}
</script>

<template>
  <Form ref="formRef" :model="formState" @finish="handleFinish" size="large">
    <Form.Item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
      <Input v-model:value="formState.username" placeholder="用户名">
        <template #prefix><UserOutlined /></template>
      </Input>
    </Form.Item>
    <Form.Item name="password" :rules="[{ required: true, message: '请输入密码' }]">
      <Input.Password v-model:value="formState.password" placeholder="密码">
        <template #prefix><LockOutlined /></template>
      </Input.Password>
    </Form.Item>
    <Form.Item>
      <Button type="primary" html-type="submit" :loading="authStore.loginLoading" block>登录</Button>
    </Form.Item>
  </Form>
</template>
