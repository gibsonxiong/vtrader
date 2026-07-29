import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type WebSocket from 'ws';

export interface WsConfig {
  url: string;
  agent?: any;
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (ws: WebSocket, data: WebSocket.Data) => void;
  onClose?: (ws: WebSocket) => void;
  onError?: (ws: WebSocket, error: Error) => void;
}

export interface HttpRequestConfig extends AxiosRequestConfig {
  retryCount?: number;
  retryDelay?: number;
}

export interface Http {
  request(CustomConfig: HttpRequestConfig): Promise<AxiosResponse<any, any>>;
}
