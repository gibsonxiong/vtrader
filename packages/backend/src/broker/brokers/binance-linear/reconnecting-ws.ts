import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { Logger } from '@nestjs/common';

export interface ReconnectingWsOptions {
  agent?: WebSocket.ClientOptions['agent'];
  /** 最大重试次数，默认 10 */
  maxRetries?: number;
  /** 首次重连延迟（ms），默认 1000 */
  minDelay?: number;
  /** 最大重连延迟（ms），默认 32000 */
  maxDelay?: number;
  /** 单次连接超时（ms），默认 500 */
  connectTimeout?: number;
}

/**
 * 自动重连 WebSocket 封装
 *
 * 事件：
 *   'open'         — 首次连接或重连成功
 *   'message'      — 收到消息
 *   'error'        — 错误
 *   'close'        — 连接关闭（重连前触发）
 *   'reconnecting' — 正在重连 (retryCount, maxRetries, delayMs)
 *   'reconnected'  — 重连成功（区别于首次连接）
 *   'failed'       — 所有重试耗尽
 */
export class ReconnectingWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private agent: WebSocket.ClientOptions['agent'] | undefined;
  private retryCount = 0;
  private maxRetries: number;
  private minDelay: number;
  private maxDelay: number;
  private connectTimeoutMs: number;
  private shouldReconnect = true;
  private isFirstConnection = true;
  private connectScheduled = false;
  private connectTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private logger = new Logger(ReconnectingWebSocket.name);

  constructor(url: string, options: ReconnectingWsOptions = {}) {
    super();
    this.url = url;
    this.agent = options.agent;
    this.maxRetries = options.maxRetries ?? 10;
    this.minDelay = options.minDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 32000;
    this.connectTimeoutMs = options.connectTimeout ?? 500;
    this.connect();
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close(): void {
    this.shouldReconnect = false;
    this.clearConnectTimer();
    this.clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
  }

  private clearConnectTimer(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private connect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
    }

    this.ws = new WebSocket(this.url, {
      agent: this.agent,
    } as WebSocket.ClientOptions);

    // 连接超时保底：TCP 连接在 Windows 上可能因 TIME_WAIT 挂起，
    // 此定时器确保连接失败时仍能触发重连
    this.connectTimer = setTimeout(() => {
      this.connectTimer = null;
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        try {
          this.ws.close();
        } catch {
          /* ignore */
        }
      }
      this.scheduleReconnect();
    }, this.connectTimeoutMs);

    this.ws.on('open', () => {
      this.clearConnectTimer();
      if (this.isFirstConnection) {
        this.isFirstConnection = false;
      } else {
        this.emit('reconnected');
      }
      this.retryCount = 0;
      this.emit('open');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.emit('message', data);
    });

    this.ws.on('error', (error: Error) => {
      this.clearConnectTimer();
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      }
      this.scheduleReconnect();
    });

    this.ws.on('close', () => {
      this.clearConnectTimer();
      this.emit('close');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.connectScheduled) {
      return;
    }
    this.connectScheduled = true;

    if (this.retryCount >= this.maxRetries) {
      this.shouldReconnect = false;
      this.connectScheduled = false;
      this.logger.warn(`WebSocket [${this.url}] 已达最大重试次数 ${this.maxRetries}，放弃重连`);
      this.emit('failed');
      return;
    }

    const delay = Math.min(this.minDelay * Math.pow(2, this.retryCount), this.maxDelay);
    this.retryCount++;

    this.logger.warn(
      `WebSocket [${this.url}] 第 ${this.retryCount}/${this.maxRetries} 次重连，等待 ${delay}ms`,
    );
    this.emit('reconnecting', this.retryCount, this.maxRetries, delay);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect) {
        this.connectScheduled = false;
        return;
      }
      this.connectScheduled = false;
      this.connect();
    }, delay);
  }
}
