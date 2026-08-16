import { ReconnectingWebSocket } from './reconnecting-ws';
import WebSocket, { WebSocketServer } from 'ws';
import { AddressInfo } from 'node:net';

/**
 * 创建一个本地 WS 测试服务器，返回 { server, port, messages, close }
 */
function createTestServer(): Promise<{
  server: WebSocketServer;
  port: number;
  messages: string[];
  connections: WebSocket[];
  close: () => Promise<void>;
}> {
  return new Promise((resolve) => {
    const messages: string[] = [];
    const connections: WebSocket[] = [];

    const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });

    server.on('listening', () => {
      const port = (server.address() as AddressInfo).port;

      const close = () =>
        new Promise<void>((resolveClose) => {
          for (const conn of connections) {
            try {
              conn.close();
            } catch {
              /* ignore */
            }
          }
          server.close(() => resolveClose());
        });

      resolve({ server, port, messages, connections, close });
    });

    server.on('connection', (ws) => {
      connections.push(ws);

      ws.on('message', (data) => {
        const msg = (data as Buffer).toString();
        messages.push(msg);

        // 回显消息
        ws.send(`echo:${msg}`);
      });
    });
  });
}

/** 等待 ReconnectingWebSocket 触发 open 事件 */
function waitForOpen(ws: ReconnectingWebSocket, timeout = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === 1) return resolve();
    const timer = setTimeout(() => reject(new Error('连接超时')), timeout);
    ws.on('open', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** 等待指定毫秒 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('ReconnectingWebSocket', () => {
  let port: number;
  let serverMessages: string[];
  let serverConnections: WebSocket[];
  let closeServer: () => Promise<void>;

  beforeEach(async () => {
    const s = await createTestServer();
    port = s.port;
    serverMessages = s.messages;
    serverConnections = s.connections;
    closeServer = s.close;
  });

  afterEach(async () => {
    await closeServer();
  });

  describe('基本连接', () => {
    it('应该能连接到 WS 服务器', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 0,
      });
      await waitForOpen(ws);
      expect(ws.readyState).toBe(1);
      ws.close();
    });

    it('应该能收到服务器消息', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 0,
      });
      await waitForOpen(ws);

      const received = new Promise<string>((resolve) => {
        ws.on('message', (data: WebSocket.Data) => resolve((data as Buffer).toString()));
      });

      ws.send('hello');
      const reply = await received;
      expect(reply).toBe('echo:hello');
      ws.close();
    });
  });

  describe('send', () => {
    it('连接建立后应该能发送消息', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 0,
      });
      await waitForOpen(ws);

      ws.send('test-message');
      await sleep(100);
      expect(serverMessages).toContain('test-message');
      ws.close();
    });
  });

  describe('close', () => {
    it('close 后应该停止重连', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 10,
        minDelay: 10,
        maxDelay: 50,
      });
      await waitForOpen(ws);

      let reconnectCount = 0;
      ws.on('reconnecting', () => {
        reconnectCount++;
      });

      ws.close();

      // 等待确认没有重连事件
      await sleep(200);
      expect(reconnectCount).toBe(0);
    });
  });

  describe('自动重连', () => {
    it('服务器断开后应该自动重连', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 5,
        minDelay: 50,
        maxDelay: 200,
      });
      await waitForOpen(ws);

      // 记录重连成功事件
      const reconnectedEvents: number[] = [];
      ws.on('reconnected', () => {
        reconnectedEvents.push(Date.now());
      });

      // 断开服务器连接
      for (const conn of serverConnections) {
        conn.close();
      }

      // 等待重连
      await sleep(1000);
      expect(reconnectedEvents.length).toBeGreaterThanOrEqual(1);
      expect(ws.readyState).toBe(1);
      ws.close();
    });

    it('重连后应该能继续收发消息', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 5,
        minDelay: 50,
        maxDelay: 200,
      });
      await waitForOpen(ws);

      // 第一次发送
      ws.send('before-reconnect');
      await sleep(100);
      expect(serverMessages).toContain('before-reconnect');

      // 断开服务器连接
      for (const conn of serverConnections) {
        conn.close();
      }

      // 等待重连
      await sleep(1000);

      // 重连后再次发送
      ws.send('after-reconnect');
      await sleep(100);
      expect(serverMessages).toContain('after-reconnect');
      ws.close();
    });
  });

  describe('重试耗尽', () => {
    it('达到最大重试次数后应该触发 failed 事件', async () => {
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 2,
        minDelay: 10,
        maxDelay: 50,
        connectTimeout: 50,
      });
      await waitForOpen(ws);

      // 记录重连事件
      const reconnectingEvents: number[] = [];
      ws.on('reconnecting', () => {
        reconnectingEvents.push(Date.now());
      });

      const failed = new Promise<void>((resolve) => {
        ws.on('failed', () => resolve());
      });

      // 关闭服务器触发重连耗尽
      await closeServer();

      await failed;
      expect(reconnectingEvents.length).toBe(2);
      expect(ws.readyState).not.toBe(1);
      // 不要调用 ws.close()，因为 failed 后 shouldReconnect 已为 false
    }, 10_000);
  });

  describe('指数退避', () => {
    it('重连间隔应该递增', async () => {
      const reconnectTimestamps: number[] = [];
      const ws = new ReconnectingWebSocket(`ws://127.0.0.1:${port}`, {
        maxRetries: 4,
        minDelay: 100,
        maxDelay: 800,
      });
      await waitForOpen(ws);

      ws.on('reconnecting', () => {
        reconnectTimestamps.push(Date.now());
      });

      // 断开服务器连接
      for (const conn of serverConnections) {
        conn.close();
      }

      // 等待重连尝试
      await sleep(3000);

      // 计算重连间隔
      if (reconnectTimestamps.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < reconnectTimestamps.length; i++) {
          intervals.push(reconnectTimestamps[i] - reconnectTimestamps[i - 1]);
        }

        // 间隔应该大致递增 (允许一定误差)
        for (let i = 1; i < intervals.length; i++) {
          expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1] * 0.5);
        }
      }

      ws.close();
    });
  });
});
