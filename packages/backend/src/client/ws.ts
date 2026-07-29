import WebSocket from 'ws';
import type { WsConfig } from '../types/client';

export function createWs(config: WsConfig): WebSocket {
  const ws = new WebSocket(config.url, {
    agent: config.agent,
    timeout: 50,
  });

  ws.on('open', () => {
    config.onOpen?.call(ws);
  });

  ws.on('message', (data: WebSocket.Data) => {
    config.onMessage?.call(ws, data);
  });

  ws.on('error', (error) => {
    config.onError?.call(ws, error);
  });

  ws.on('close', () => {
    config.onClose?.call(ws);
  });

  return ws;
}
