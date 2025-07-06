import type { BinanceLinearGateway } from './index';

import * as WebSocket from 'ws';

import { BarData, Interval, TickData } from '../../types/common';
import { REAL_DATA_HOST, TESTNET_DATA_HOST } from './constants';
import { SubscribeRequest } from './types';

/**
 * 市场数据API客户端
 */
export class MdApi {
  private gateway: BinanceLinearGateway;
  private klineStream: boolean = false;
  private subscriptions: Set<string> = new Set();
  private ws: null | WebSocket = null;

  constructor(gateway: BinanceLinearGateway) {
    this.gateway = gateway;
  }

  /**
   * 连接到市场数据API
   */
  public async connect(
    server: string,
    klineStream: boolean,
    proxyHost?: string,
    proxyPort?: number,
  ): Promise<void> {
    this.klineStream = klineStream;

    const wsUrl = server === 'REAL' ? REAL_DATA_HOST : TESTNET_DATA_HOST;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.gateway.writeLog('市场数据WebSocket连接成功');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.onMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        this.gateway.writeLog(`市场数据WebSocket错误: ${error}`);
        reject(error);
      });

      this.ws.on('close', () => {
        this.gateway.writeLog('市场数据WebSocket连接关闭');
      });
    });
  }

  /**
   * 停止市场数据API
   */
  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 订阅市场数据
   */
  public subscribe(req: SubscribeRequest): void {
    const contract = this.gateway.getContractBySymbol(req.symbol);
    if (!contract) {
      this.gateway.writeLog(`找不到合约: ${req.symbol}`);
      return;
    }

    const symbol = contract.name.toLowerCase();

    // 订阅Ticker数据
    const tickerStream = `${symbol}@ticker`;
    this.subscriptions.add(tickerStream);

    // 订阅深度数据
    const depthStream = `${symbol}@depth5@100ms`;
    this.subscriptions.add(depthStream);

    // 如果启用K线流，订阅K线数据
    if (this.klineStream) {
      const klineStream = `${symbol}@kline_1m`;
      this.subscriptions.add(klineStream);
    }

    this.sendSubscribe();
  }

  /**
   * 处理深度数据
   */
  private onDepthData(data: any): void {
    const contract = this.gateway.getContractByName(data.s);
    if (!contract) {
      return;
    }

    const bids = data.b;
    const asks = data.a;

    const tick: TickData = {
      symbol: contract.symbol,
      datetime: new Date(),
      name: contract.name,
      volume: 0,
      lastPrice: 0,
      lastVolume: 0,
      limit_up: 0,
      limit_down: 0,
      openPrice: 0,
      highPrice: 0,
      lowPrice: 0,
      preClose: 0,
      bidPrice1: Number.parseFloat(bids[0]?.[0] || '0'),
      bidPrice2: Number.parseFloat(bids[1]?.[0] || '0'),
      bidPrice3: Number.parseFloat(bids[2]?.[0] || '0'),
      bidPrice4: Number.parseFloat(bids[3]?.[0] || '0'),
      bidPrice5: Number.parseFloat(bids[4]?.[0] || '0'),
      askPrice1: Number.parseFloat(asks[0]?.[0] || '0'),
      askPrice2: Number.parseFloat(asks[1]?.[0] || '0'),
      askPrice3: Number.parseFloat(asks[2]?.[0] || '0'),
      askPrice4: Number.parseFloat(asks[3]?.[0] || '0'),
      askPrice5: Number.parseFloat(asks[4]?.[0] || '0'),
      bidVolume1: Number.parseFloat(bids[0]?.[1] || '0'),
      bidVolume2: Number.parseFloat(bids[1]?.[1] || '0'),
      bidVolume3: Number.parseFloat(bids[2]?.[1] || '0'),
      bidVolume4: Number.parseFloat(bids[3]?.[1] || '0'),
      bidVolume5: Number.parseFloat(bids[4]?.[1] || '0'),
      askVolume1: Number.parseFloat(asks[0]?.[1] || '0'),
      askVolume2: Number.parseFloat(asks[1]?.[1] || '0'),
      askVolume3: Number.parseFloat(asks[2]?.[1] || '0'),
      askVolume4: Number.parseFloat(asks[3]?.[1] || '0'),
      askVolume5: Number.parseFloat(asks[4]?.[1] || '0'),
    };

    this.gateway.onTick(tick);
  }

  /**
   * 处理K线数据
   */
  private onKlineData(data: any): void {
    const contract = this.gateway.getContractByName(data.s);
    if (!contract) {
      return;
    }

    const kline = data.k;
    if (!kline.x) {
      // 只处理已完成的K线
      return;
    }

    const bar: BarData = {
      symbol: contract.symbol,
      timestamp: kline.t,
      interval: Interval.MINUTE,
      volume: Number.parseFloat(kline.v),
      open: Number.parseFloat(kline.o),
      high: Number.parseFloat(kline.h),
      low: Number.parseFloat(kline.l),
      close: Number.parseFloat(kline.c),
    };

    this.gateway.onBar(bar);
  }

  /**
   * 处理WebSocket消息
   */
  private onMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      if (msg.stream) {
        const stream = msg.stream;
        const data = msg.data;

        if (stream.includes('@ticker')) {
          this.onTickerData(data);
        } else if (stream.includes('@depth')) {
          this.onDepthData(data);
        } else if (stream.includes('@kline')) {
          this.onKlineData(data);
        }
      }
    } catch (error) {
      this.gateway.writeLog(`解析市场数据消息失败: ${error}`);
    }
  }

  /**
   * 处理Ticker数据
   */
  private onTickerData(data: any): void {
    const contract = this.gateway.getContractByName(data.s);
    if (!contract) {
      return;
    }

    const tick: TickData = {
      symbol: contract.symbol,
      datetime: new Date(data.E),
      name: contract.name,
      volume: Number.parseFloat(data.v),
      lastPrice: Number.parseFloat(data.c),
      lastVolume: 0,
      limit_up: 0,
      limit_down: 0,
      openPrice: Number.parseFloat(data.o),
      highPrice: Number.parseFloat(data.h),
      lowPrice: Number.parseFloat(data.l),
      preClose: Number.parseFloat(data.x),
      bidPrice1: 0,
      bidPrice2: 0,
      bidPrice3: 0,
      bidPrice4: 0,
      bidPrice5: 0,
      askPrice1: 0,
      askPrice2: 0,
      askPrice3: 0,
      askPrice4: 0,
      askPrice5: 0,
      bidVolume1: 0,
      bidVolume2: 0,
      bidVolume3: 0,
      bidVolume4: 0,
      bidVolume5: 0,
      askVolume1: 0,
      askVolume2: 0,
      askVolume3: 0,
      askVolume4: 0,
      askVolume5: 0,
    };

    this.gateway.onTick(tick);
  }

  /**
   * 发送订阅请求
   */
  private sendSubscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const req = {
      method: 'SUBSCRIBE',
      params: [...this.subscriptions],
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(req));
  }
}
