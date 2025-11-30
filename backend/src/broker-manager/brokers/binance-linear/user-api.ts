import { Direction, type AssetData, type OrderData, type PositionData, type TradeData } from '@vtrader/shared';
import type { BinanceLinearBroker } from './broker';

import WebSocket from 'ws';

import { binance2direction, binance2offset, binance2ordertype, binance2status } from './constants';
import { SocksProxyAgent } from 'socks-proxy-agent';

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
  public async connect(listenKey: string): Promise<void> {
    // const wsUrl = `${server === 'REAL' ? REAL_USER_HOST : TESTNET_USER_HOST}${listenKey}`;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.broker.USER_HOST}/${listenKey}`, {
        agent: new SocksProxyAgent('socks5h://127.0.0.1:7890')
      });

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
      const asset: AssetData = { //TODO
        assetName: balance.a,
        balance: Number.parseFloat(balance.wb),
        available: Number.parseFloat(balance.cw),
        frozen: Number.parseFloat(balance.wb) - Number.parseFloat(balance.cw),
      };

      this.broker.onAsset(asset);
    }

    // 处理持仓更新
    for (const position of data.P) {
      const pos: PositionData = {
        symbol: position.s,
        direction: position.ps === 'SHORT' ? Direction.SHORT : Direction.LONG,
        volume: Math.abs(Number.parseFloat(position.pa)),
        price: Number.parseFloat(position.ep),
        pnl: Number.parseFloat(position.up),
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
    const contract = this.broker.getContractByName(data.s);

    if (!contract) {
      return;
    }

    const order: OrderData = {
      symbol: contract.symbol,
      orderId: data.c,
      type: binance2ordertype(data.o),
      direction: binance2direction(data.ps),
      offset: binance2offset(data.ps, data.S),
      price: Number.parseFloat(data.p),
      status: binance2status(data.X),
      volume: Number.parseFloat(data.q),
      tradePrice: Number.parseFloat(data.L),
      tradeVolume: Number.parseFloat(data.l),
      tradeCommission: Number.parseFloat(data.n),
      avgPrice: Number.parseFloat(data.ap),
      traded: Number.parseFloat(data.z),
      time: new Date(data.T),
      msg: '',
    };

    this.broker.onOrder(order);

    // 如果有成交，推送成交数据
    if (Number.parseFloat(data.l) > 0) {
      const trade: TradeData = {
        symbol: data.s,
        orderId: data.c,
        direction: binance2direction(data.ps),
        offset: binance2offset(data.ps, data.S),
        tradeId: data.t.toString(),
        price: Number.parseFloat(data.L),
        volume: Number.parseFloat(data.l),
        time: new Date(data.T),
        commission: Number.parseFloat(data.n),
      };

      this.broker.onTrade(trade);
    }
  }
}
