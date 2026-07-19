<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { Form, Input, Button, Select, Card, message } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '#/store';
import { $t } from '#/locales';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formRef = ref();
const formState = reactive({
  username: 'vben',
  password: '123456',
});

const userOptions = [
  { label: 'Super (vben)', value: 'vben' },
  { label: 'Admin (admin)', value: 'admin' },
  { label: 'User (jack)', value: 'jack' },
];

function onSelectUser(value: string) {
  formState.username = value;
  formState.password = '123456';
}

async function handleFinish() {
  try {
    await authStore.authLogin({
      username: formState.username,
      password: formState.password,
    });
  } catch {
    message.error($t('authentication.loginFail'));
  }
}
</script>

<template>
  <Card :bordered="false">
    <h2 style="text-align: center; margin-bottom: 24px">{{ $t('authentication.pageTitle') }}</h2>
    <Form ref="formRef" :model="formState" @finish="handleFinish">
      <Form.Item>
        <Select
          :value="formState.username"
          :options="userOptions"
          placeholder="选择账号"
          @change="onSelectUser"
        />
      </Form.Item>
      <Form.Item
        name="username"
        :rules="[{ required: true, message: $t('authentication.usernameTip') }]"
      >
        <Input
          v-model:value="formState.username"
          :placeholder="$t('authentication.usernameTip')"
          size="large"
        >
          <template #prefix><UserOutlined /></template>
        </Input>
      </Form.Item>
      <Form.Item
        name="password"
        :rules="[{ required: true, message: $t('authentication.passwordTip') }]"
      >
        <Input.Password
          v-model:value="formState.password"
          :placeholder="$t('authentication.password')"
          size="large"
        >
          <template #prefix><LockOutlined /></template>
        </Input.Password>
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          html-type="submit"
          :loading="authStore.loginLoading"
          block
          size="large"
        >
          {{ $t('authentication.login') }}
        </Button>
      </Form.Item>
    </Form>
  </Card>
</template>
