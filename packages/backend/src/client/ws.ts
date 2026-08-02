import WebSocket from 'ws';
import type { WsConfig } from '../types/client';

export function createWs(config: WsConfig): WebSocket {
  const ws = new WebSocket(config.url, {
    agent: config.agent,
    timeout: 50,
  });

  ws.on('open', () => {
    config.onOpen?.(ws);
  });

  ws.on('message', (data: WebSocket.Data) => {
    config.onMessage?.(ws, data);
  });

  ws.on('error', (error: Error) => {
    config.onError?.(ws, error);
  });

  ws.on('close', () => {
    config.onClose?.(ws);
  });

  return ws;
}
