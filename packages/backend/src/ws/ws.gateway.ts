import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import type { SubscribeRequest } from '../types/broker';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private tickTimer: NodeJS.Timer | null = null;
  private watchedBrokers: Set<string> = new Set();
  private clientSubs: Map<string, Set<string>> = new Map();
  private roomCounts: Map<string, number> = new Map();
  private roomMeta: Map<string, { brokerId: string; symbol: string; interval: string }> = new Map();
  constructor(private readonly brokerManager: BrokerManagerService) {}

  afterInit() {
    this.tickTimer = setInterval(() => {
      this.server.emit('tick', Date.now());
    }, 5000);
  }

  handleConnection(client: Socket) {
    client.emit('welcome', 'connected');
  }

  handleDisconnect(client: Socket) {
    const rooms = this.clientSubs.get(client.id);
    if (!rooms) return;
    for (const room of rooms) {
      const meta = this.roomMeta.get(room);
      if (!meta) continue;
      const count = (this.roomCounts.get(room) || 0) - 1;
      if (count <= 0) {
        this.roomCounts.delete(room);
        this.brokerManager.getBroker(meta.brokerId).then((broker) => {
          broker.unsubscribeBar({ symbol: meta.symbol, interval: meta.interval as any });
        });
      } else {
        this.roomCounts.set(room, count);
      }
      try {
        client.leave(room);
      } catch {}
    }
    this.clientSubs.delete(client.id);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() payload: string) {
    this.server.emit('echo', payload);
  }

  @SubscribeMessage('subscribeKline')
  async handleSubscribeKline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeRequest & { brokerId: string },
  ) {
    const { brokerId, symbol, interval } = payload;
    const room = `kline:${brokerId}:${symbol}:${interval}`;
    client.join(room);
    this.roomMeta.set(room, { brokerId, symbol, interval });
    const clientRooms = this.clientSubs.get(client.id) || new Set<string>();
    clientRooms.add(room);
    this.clientSubs.set(client.id, clientRooms);
    const prevCount = this.roomCounts.get(room) || 0;
    this.roomCounts.set(room, prevCount + 1);

    if (prevCount === 0) {
      try {
        const broker = await this.brokerManager.getBroker(brokerId);
        broker.subscribeBar({ symbol, interval });

        if (!this.watchedBrokers.has(brokerId)) {
          this.watchedBrokers.add(brokerId);
          broker.on('bar', (bar) => {
            const roomKey = `kline:${brokerId}:${bar.symbol}:${bar.interval}`;
            this.server.to(roomKey).emit('bar', bar);
          });
        }
      } catch (err: any) {
        client.emit('subscribeError', { brokerId, symbol, interval, message: `Broker连接失败: ${err.message}` });
        return false;
      }
    }
    client.emit('subscribeOk', { brokerId, symbol, interval, room });
    return true;
  }

  @SubscribeMessage('unsubscribeKline')
  async handleUnsubscribeKline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeRequest & { brokerId: string },
  ) {
    const { brokerId, symbol, interval } = payload;
    const room = `kline:${brokerId}:${symbol}:${interval}`;
    const clientRooms = this.clientSubs.get(client.id);
    if (clientRooms) {
      clientRooms.delete(room);
      if (clientRooms.size === 0) this.clientSubs.delete(client.id);
    }
    client.leave(room);

    const prevCount = this.roomCounts.get(room) || 0;
    const next = Math.max(0, prevCount - 1);
    if (next === 0) {
      this.roomCounts.delete(room);
      const broker = await this.brokerManager.getBroker(brokerId);
      broker.unsubscribeBar({ symbol, interval });
    } else {
      this.roomCounts.set(room, next);
    }
    client.emit('unsubscribeOk', { brokerId, symbol, interval, room });
    return true;
  }
}