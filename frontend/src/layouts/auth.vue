<script lang="ts" setup>
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f2f5;
    "
  >
    <div style="width: 400px">
      <div style="text-align: center; margin-bottom: 24px">
        <h1 style="font-size: 32px">VTrader</h1>
        <p style="color: #999">加密货币量化交易平台</p>
      </div>
      <RouterView />
    </div>
  </div>
</template>
