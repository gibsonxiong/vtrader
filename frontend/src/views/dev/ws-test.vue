<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue';
import { io, Socket } from 'socket.io-client';

const url = ref('http://localhost:3000/ws');
const socket = ref<Socket | null>(null);
const status = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const logs = ref<string[]>([]);
const brokerId = ref('1');
const symbol = ref('BTCUSDT:USDT');
const interval = ref('5m');

function connect() {
  if (socket.value) socket.value.disconnect();
  status.value = 'connecting';
  const s = io(url.value, {
    transports: ['websocket'],
    withCredentials: true,
  });
  socket.value = s;
  s.on('connect', () => {
    status.value = 'connected';
    logs.value.unshift('连接成功');
  });
  s.on('disconnect', () => {
    status.value = 'disconnected';
    logs.value.unshift('连接关闭');
  });
  s.on('connect_error', (err) => {
    logs.value.unshift(`连接错误: ${err.message}`);
  });
  s.on('welcome', (data) => {
    logs.value.unshift(JSON.stringify({ event: 'welcome', data }));
  });
  s.on('bar', (data) => {
    logs.value.unshift(JSON.stringify({ event: 'bar', data }));
  });
}

function disconnect() {
  if (socket.value) socket.value.disconnect();
}

function subscribeKline() {
  if (!socket.value || status.value !== 'connected') return;
  socket.value.emit('subscribeKline', {
    brokerId: brokerId.value,
    symbol: symbol.value,
    interval: interval.value,
  }, () => {
    logs.value.unshift(`订阅成功`);
  });
}

function unsubscribeKline() {
  if (!socket.value || status.value !== 'connected') return;
  socket.value.emit('unsubscribeKline', {
    brokerId: brokerId.value,
    symbol: symbol.value,
    interval: interval.value,
  }, () => {
    logs.value.unshift(`取消订阅`);
  });
}

onBeforeUnmount(disconnect);
</script>

<template>
  <div class="flex-1 overflow-auto p-6">
    <div class="space-y-6">
      <div class="bg-card text-card-foreground rounded-xl border">
        <div class="px-6 pt-6">
          <h4 class="text-lg font-medium">WebSocket 测试</h4>
          <p class="text-muted-foreground text-sm">Socket.IO + Nest Gateway</p>
        </div>

        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">命名空间地址</span>
                <input
                  class="flex-1 rounded border px-3 py-2 text-sm bg-background"
                  v-model="url"
                  placeholder="http://localhost:3000/ws"
                />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm">状态</span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="{
                    'bg-green-100 text-green-700': status === 'connected',
                    'bg-yellow-100 text-yellow-700': status === 'connecting',
                    'bg-gray-100 text-gray-600': status === 'disconnected',
                  }"
                >
                  {{ status }}
                </span>
                <button
                  class="ml-auto rounded bg-primary text-primary-foreground px-3 py-2 text-sm"
                  @click="connect"
                >
                  连接
                </button>
                <button
                  class="rounded bg-destructive text-destructive-foreground px-3 py-2 text-sm"
                  @click="disconnect"
                >
                  断开
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">brokerId</span>
                  <input class="flex-1 rounded border px-3 py-2 text-sm bg-background" v-model="brokerId" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">symbol</span>
                  <input class="flex-1 rounded border px-3 py-2 text-sm bg-background" v-model="symbol" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">interval</span>
                  <input class="flex-1 rounded border px-3 py-2 text-sm bg-background" v-model="interval" />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="rounded bg-secondary text-secondary-foreground px-3 py-2 text-sm" @click="subscribeKline">
                  订阅Kline
                </button>
                <button class="rounded bg-muted text-foreground px-3 py-2 text-sm" @click="unsubscribeKline">
                  取消订阅
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm text-gray-600">消息</div>
              <div class="rounded border bg-background p-3 h-64 overflow-auto text-sm">
                <div v-if="logs.length === 0" class="text-muted-foreground">暂无消息</div>
                <div v-else class="space-y-2">
                  <div v-for="(log, i) in logs" :key="i" class="break-all">{{ log }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
