import type { BinanceLinearBroker } from './index';

import * as WebSocket from 'ws';

import { OrderStatus } from '../../../types/common';
import { CancelRequest, OrderRequest } from '../../../types/broker';
import { REAL_TRADE_HOST, TESTNET_TRADE_HOST } from './constants';

/**
 * 交易API客户端
 */
export class TradeApi {
  private apiKey: string = '';
  private apiSecret: string = '';
  private broker: BinanceLinearBroker;
  private orderCount: number = 1_000_000;
  private server: string = '';
  private ws: null | WebSocket = null;

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 撤销订单
   */
  public cancelOrder(req: CancelRequest): void {
    // 实现撤单逻辑
    const order = this.broker.getOrder(req.orderId);
    if (order) {
      order.status = OrderStatus.CANCELLED;
      this.broker.onOrder(order);
    }
  }

  /**
   * 连接到交易API
   */
  public async connect(
    apiKey: string,
    apiSecret: string,
    server: string,
    proxyHost?: string,
    proxyPort?: number,
  ): Promise<void> {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.server = server;

    const wsUrl = server === 'REAL' ? REAL_TRADE_HOST : TESTNET_TRADE_HOST;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.broker.writeLog('交易WebSocket连接成功');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.onMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        this.broker.writeLog(`交易WebSocket错误: ${error}`);
        reject(error);
      });

      this.ws.on('close', () => {
        this.broker.writeLog('交易WebSocket连接关闭');
      });
    });
  }

  /**
   * 发送订单
   */
  public sendOrder(req: OrderRequest): string {
    const orderId = `${this.orderCount++}`;

    // 这里应该实现实际的订单发送逻辑
    // 由于这是回测环境，我们只是模拟订单创建
    // const order: OrderData = {
    //   symbol: req.symbol,
    //   exchange: req.exchange.toString(),
    //   orderId,
    //   type: req.type,
    //   direction: req.direction,
    //   offset: req.offset || Offset.OPEN,
    //   price: req.price || 0,
    //   volume: req.volume,
    //   avgPrice: 0,
    //   traded: 0,
    //   status: OrderStatus.SUBMITTING,
    //   time: new Date(),
    // };

    // this.broker.onOrder(order);
    return orderId;
  }

  /**
   * 停止交易API
   */
  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 处理WebSocket消息
   */
  private onMessage(data: string): void {
    try {
      const msg = JSON.parse(data);
      // 处理不同类型的消息
    } catch (error) {
      this.broker.writeLog(`解析交易消息失败: ${error}`);
    }
  }
}
