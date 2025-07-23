import type { AccountData, OrderData, PositionData, TradeData } from '../../../types/common';
import type { BinanceLinearBroker } from './index';

import * as WebSocket from 'ws';

import { Direction, Exchange, Offset, OrderType } from '../../../types/common';
import { REAL_USER_HOST, STATUS_BINANCE2VT, TESTNET_USER_HOST } from './constants';

function binance2offset(direction: 'LONG' | 'SHORT', side: 'BUY' | 'SELL'): Offset {
  if (direction === 'LONG') {
    return side === 'BUY' ? Offset.OPEN : Offset.CLOSE;
  } else {
    return side === 'BUY' ? Offset.CLOSE : Offset.OPEN;
  }
}

/**
 * 用户数据API客户端
 */
export class UserApi {
  private broker: BinanceLinearBroker;
  private ws: null | WebSocket = null;

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到用户数据API
   */
  public async connect(listenKey: string, server: string): Promise<void> {
    const wsUrl = `${server === 'REAL' ? REAL_USER_HOST : TESTNET_USER_HOST}${listenKey}`;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.broker.writeLog('用户数据WebSocket连接成功');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.onMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        this.broker.writeLog(`用户数据WebSocket错误: ${error}`);
        reject(error);
      });

      this.ws.on('close', () => {
        this.broker.writeLog('用户数据WebSocket连接关闭');
      });
    });
  }

  /**
   * 停止用户数据API
   */
  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 处理账户更新
   */
  private onAccountUpdate(data: any): void {
    // 处理余额更新
    for (const balance of data.B) {
      const account: AccountData = {
        accountId: balance.a,
        balance: Number.parseFloat(balance.wb),
        frozen: Number.parseFloat(balance.cw) - Number.parseFloat(balance.wb),
      };

      this.broker.onAccount(account);
    }

    // 处理持仓更新
    for (const position of data.P) {
      const pos: PositionData = {
        symbol: position.s,
        direction: position.ps === 'LONG' ? Direction.LONG : Direction.SHORT,
        volume: Math.abs(Number.parseFloat(position.pa)),
        price: Number.parseFloat(position.ep),
        pnl: Number.parseFloat(position.up),
        frozen: 0,
        ydVolume: 0,
      };

      this.broker.onPosition(pos);
    }
  }

  /**
   * 处理WebSocket消息
   */
  private onMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      if (msg.e === 'ORDER_TRADE_UPDATE') {
        this.onOrderUpdate(msg.o);
      } else if (msg.e === 'ACCOUNT_UPDATE') {
        this.onAccountUpdate(msg.a);
      }
    } catch (error) {
      this.broker.writeLog(`解析用户数据消息失败: ${error}`);
    }
  }

  /**
   * 处理订单更新
   */
  private onOrderUpdate(data: any): void {
    const order: OrderData = {
      symbol: data.s,
      exchange: Exchange.BINANCE.toString(),
      orderId: data.c,
      type: data.o === 'LIMIT' ? OrderType.LIMIT : OrderType.MARKET,
      direction: data.ps === 'LONG' ? Direction.LONG : Direction.SHORT,
      offset: binance2offset(data.ps, data.S),
      price: Number.parseFloat(data.p),
      volume: Number.parseFloat(data.q),
      lastPrice: Number.parseFloat(data.L),
      lastVolume: Number.parseFloat(data.l),
      avgPrice: Number.parseFloat(data.ap),
      traded: Number.parseFloat(data.z),
      status: STATUS_BINANCE2VT[data.X],
      time: new Date(data.T),
    };

    this.broker.onOrder(order);

    // 如果有成交，推送成交数据
    if (Number.parseFloat(data.l) > 0) {
      const trade: TradeData = {
        symbol: data.s,
        orderId: data.c,
        tradeId: data.t.toString(),
        direction: data.ps === 'LONG' ? Direction.LONG : Direction.SHORT,
        offset: binance2offset(data.ps, data.S),
        price: Number.parseFloat(data.L),
        volume: Number.parseFloat(data.l),
        time: new Date(data.T),
        commission: Number.parseFloat(data.n),
      };

      this.broker.onTrade(trade);
    }
  }
}
