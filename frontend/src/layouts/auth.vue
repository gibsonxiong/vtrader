<script lang="ts" setup>
defineOptions({ name: 'AuthLayout' });
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1 class="auth-logo">VTrader</h1>
      <p class="auth-sub">加密货币量化交易平台</p>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  display: flex; align-items: center; justify-content: center; min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px;
}
.auth-card {
  width: 100%; max-width: 360px; background: #fff; border-radius: 12px; padding: 32px 24px;
}
.auth-logo { text-align: center; font-size: 28px; margin-bottom: 4px; }
.auth-sub { text-align: center; color: #999; font-size: 14px; margin-bottom: 24px; }
</style>
