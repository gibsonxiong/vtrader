import WebSocket from 'ws';

export interface WsConfig {
  url: string;
  agent?: any;
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (ws: WebSocket, data: WebSocket.Data) => void;
  onClose?: (ws: WebSocket) => void;
  onError?: (ws: WebSocket, error: Error) => void;
}

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
