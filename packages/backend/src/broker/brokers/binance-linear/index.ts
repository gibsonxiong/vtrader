import dayjs from 'dayjs';
import type { AssetData, ContractData } from '../../../types/common';

import WebSocket from 'ws';
import * as crypto from 'node:crypto';

import {
  BarData,
  Direction,
  Interval,
  Offset,
  OrderbookData,
  OrderData,
  OrderStatus,
  OrderType,
  PositionData,
  Product,
  TickData,
  TradeData,
} from '../../../types/common';
import {
  CancelOrderRequest,
  BrokerSettings,
  HistoryRequest,
  SendOrderRequest,
  SubscribeRequest,
  ClearHandler,
  type BrokerType,
} from '../../../types/broker';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { createHttp } from '../../../client/http';
import type { Http } from '../../../types/client';
import { createWs } from '../../../client/ws';
import { Broker } from '../../broker';

// ============================================================
// constants.ts
// ============================================================

// 状态映射
const STATUS_BINANCE2VT: Record<string, OrderStatus> = {
  NEW: OrderStatus.NOTTRADED,
  PARTIALLY_FILLED: OrderStatus.PARTTRADED,
  FILLED: OrderStatus.ALLTRADED,
  CANCELED: OrderStatus.CANCELLED,
  REJECTED: OrderStatus.REJECTED,
  EXPIRED: OrderStatus.CANCELLED,
};

// 方向映射
const DIRECTION_VT2BINANCE: Record<Direction, string> = {
  [Direction.LONG]: 'BUY',
  [Direction.SHORT]: 'SELL',
};

const DIRECTION_BINANCE2VT: Record<string, Direction> = {
  BUY: Direction.LONG,
  SELL: Direction.SHORT,
};

// 产品映射
const PRODUCT_BINANCE2VT: Record<string, Product> = {
  PERPETUAL: Product.SWAP,
  PERPETUAL_DELIVERING: Product.SWAP,
  CURRENT_MONTH: Product.FUTURES,
  NEXT_MONTH: Product.FUTURES,
  CURRENT_QUARTER: Product.FUTURES,
  NEXT_QUARTER: Product.FUTURES,
};

// K线间隔映射
const INTERVAL_VT2BINANCE: Record<Interval, string> = {
  [Interval.MINUTE_1]: '1m',
  [Interval.MINUTE_5]: '5m',
  [Interval.MINUTE_15]: '15m',
  [Interval.MINUTE_30]: '30m',
  [Interval.HOUR_1]: '1h',
  [Interval.HOUR_2]: '2h',
  [Interval.HOUR_4]: '4h',
  [Interval.HOUR_6]: '6h',
  [Interval.HOUR_8]: '8h',
  [Interval.HOUR_12]: '12h',
  [Interval.DAILY_1]: '1d',
  [Interval.DAILY_3]: '3d',
  [Interval.WEEKLY_1]: '1w',
  [Interval.MONTHLY_1]: '1M',
};

export const INTERVAL_VT2DAYJS: Record<Interval, [number, dayjs.ManipulateType]> = {
  [Interval.MINUTE_1]: [1, 'm'],
  [Interval.MINUTE_5]: [5, 'm'],
  [Interval.MINUTE_15]: [15, 'm'],
  [Interval.MINUTE_30]: [30, 'm'],
  [Interval.HOUR_1]: [1, 'h'],
  [Interval.HOUR_2]: [2, 'h'],
  [Interval.HOUR_4]: [4, 'h'],
  [Interval.HOUR_6]: [6, 'h'],
  [Interval.HOUR_8]: [8, 'h'],
  [Interval.HOUR_12]: [12, 'h'],
  [Interval.DAILY_1]: [1, 'd'],
  [Interval.DAILY_3]: [3, 'd'],
  [Interval.WEEKLY_1]: [1, 'w'],
  [Interval.MONTHLY_1]: [1, 'M'],
};

// 方向偏移映射（用于positionSide）
const DIRECTION_OFFSET2BINANCE: Record<Direction, string> = {
  [Direction.LONG]: 'LONG',
  [Direction.SHORT]: 'SHORT',
};

// 订单类型映射
const ORDERTYPE_VT2BINANCE: Record<OrderType, [string, string]> = {
  [OrderType.LIMIT]: ['LIMIT', 'GTC'],
  [OrderType.MARKET]: ['MARKET', 'GTC'],
  [OrderType.STOP]: ['STOP_MARKET', 'GTC'],
};

// 格式化浮点数函数
function formatFloat(value: number): string {
  return value.toFixed(8).replace(/\.?0+$/, '');
}

function binance2direction(positionSide: 'LONG' | 'SHORT' | 'BOTH'): Direction {
  if (positionSide === 'BOTH') return Direction.LONG;
  
  return positionSide === 'LONG' ? Direction.LONG : Direction.SHORT
}

function binance2offset(positionSide: 'LONG' | 'SHORT' | 'BOTH', side: 'BUY' | 'SELL'): Offset {
  if (positionSide === 'BOTH') {
    return side === 'BUY' ? Offset.OPEN : Offset.CLOSE;
  } else if (positionSide === 'LONG') {
    return side === 'BUY' ? Offset.OPEN : Offset.CLOSE;
  } else {
    return side === 'BUY' ? Offset.CLOSE : Offset.OPEN;
  }
}


function binance2status(status: string): OrderStatus {
  return STATUS_BINANCE2VT[status];
}

function binance2ordertype(orderType: string): OrderType {
  return orderType === 'LIMIT' ? OrderType.LIMIT : OrderType.MARKET;
}

// ============================================================
// proxy.ts
// ============================================================

const DEFAULT_BINANCE_PROXY_URL = 'http://127.0.0.1:7897';

function getBinanceProxyUrl() {
  return process.env.BINANCE_PROXY_URL?.trim() || DEFAULT_BINANCE_PROXY_URL;
}

function isSocksProxy(proxyUrl: string) {
  return proxyUrl.startsWith('socks://')
    || proxyUrl.startsWith('socks4://')
    || proxyUrl.startsWith('socks4a://')
    || proxyUrl.startsWith('socks5://')
    || proxyUrl.startsWith('socks5h://');
}

function createBinanceHttpAgents() {
  const proxyUrl = getBinanceProxyUrl();

  if (isSocksProxy(proxyUrl)) {
    const agent = new SocksProxyAgent(proxyUrl);
    return {
      httpAgent: agent,
      httpsAgent: agent,
    };
  }

  return {
    httpAgent: new HttpProxyAgent(proxyUrl),
    httpsAgent: new HttpsProxyAgent(proxyUrl),
  };
}

function createBinanceWsAgent(targetUrl: string) {
  const proxyUrl = getBinanceProxyUrl();

  if (isSocksProxy(proxyUrl)) {
    return new SocksProxyAgent(proxyUrl);
  }

  if (targetUrl.startsWith('wss://')) {
    return new HttpsProxyAgent(proxyUrl);
  }

  return new HttpProxyAgent(proxyUrl);
}

// ============================================================
// MdApi (md-api.ts)
// ============================================================

/**
 * 市场数据API客户端
 */
class MdApi {
  private broker: BinanceLinearBroker;
  private subscriptions: Set<string> = new Set();
  private ws: null | WebSocket = null;

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到市场数据API
   */
  public async connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.broker.DATA_HOST, {
          agent: createBinanceWsAgent(this.broker.DATA_HOST),
        });

        const connectTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.broker.writeLog('市场数据WebSocket连接超时（将继续运行，数据不可用）');
            resolve();
          }
        }, 10_000);

        this.ws.on('open', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('市场数据WebSocket连接成功');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.onMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          clearTimeout(connectTimeout);
          this.broker.writeLog(`市场数据WebSocket连接失败: ${error.message}（将继续运行，数据不可用）`);
          resolve();
        });

        this.ws.on('close', () => {
          this.broker.writeLog('市场数据WebSocket连接关闭');
        });
      } catch (err: unknown) {
        this.broker.writeLog(`市场数据WebSocket创建失败: ${(err as Error).message}（将继续运行，数据不可用）`);
        resolve();
      }
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
  public subscribeBar(req: SubscribeRequest): void {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      this.broker.writeLog(`找不到合约: ${req.symbol}`);
      return;
    }

    const symbol = contract.name.toLowerCase();

    // 如果启用K线流，订阅K线数据
    const params = [`${symbol}@kline_${req.interval}`];

    this.send('SUBSCRIBE', params);
  }

  /**取消订阅*/
  public unsubscribeBar(req: SubscribeRequest): void {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      return;
    }

    const symbol = contract.name.toLowerCase();

    // 如果启用K线流，取消订阅K线数据
    const params = [`${symbol}@kline_${req.interval}`];

    this.send('UNSUBSCRIBE', params);
  }

  /**
   * 处理深度数据
   */
  private onDepthData(data: any): void {
    const contract = this.broker.getContractByName(data.s);
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

    this.broker.onTick(tick);
  }

  /**
   * 处理K线数据
   */
  private onKlineData(data: any): void {
    const contract = this.broker.getContractByName(data.s);
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
      interval: kline.i as Interval,
      volume: Number.parseFloat(kline.v),
      open: Number.parseFloat(kline.o),
      high: Number.parseFloat(kline.h),
      low: Number.parseFloat(kline.l),
      close: Number.parseFloat(kline.c),
    };

    this.broker.onBar(bar);
  }

  /**
   * 处理WebSocket消息
   */
  private onMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      console.log('md onMessage', msg)

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
      this.broker.writeLog(`解析市场数据消息失败: ${error}`);
    }
  }

  /**
   * 处理Ticker数据
   */
  private onTickerData(data: any): void {
    const contract = this.broker.getContractByName(data.s);
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

    this.broker.onTick(tick);
  }

  /**
   * 发送订阅请求
   */
  private send(method: string, params: any[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const req = {
      method,
      params,
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(req));
  }
}

// ============================================================
// RestApi (rest-api.ts)
// ============================================================

/**
 * REST API客户端
 */
class RestApi {
  public userStreamKey: string = '';
  private apiKey: string = '';
  private apiSecret: string = '';
  private client: Http;
  private broker: BinanceLinearBroker;
  private keepAliveCount: number = 0;


  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
    
  }

  /**
   * 连接到REST API
   */
  public async connect(
    apiKey: string,
    apiSecret: string,
  ): Promise<void> {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.client = createHttp({
      baseURL: this.broker.REST_HOST,
      proxy: false,
      ...createBinanceHttpAgents(),
    });

    // 查询服务器时间
    await this.queryTime();

    // 查询合约信息
    await this.queryContract();

    // 启动用户数据流
    await this.startUserStream();

    this.broker.writeLog('REST API连接成功');
  }

  /**
   * 保持用户数据流活跃
   */
  public async keepUserStream(): Promise<void> {
    if (!this.userStreamKey) {
      return;
    }

    this.keepAliveCount++;
    if (this.keepAliveCount < 600) {
      return;
    }
    this.keepAliveCount = 0;

    try {
      await this.sendSignedRequest('PUT', '/fapi/v1/listenKey', {
        listenKey: this.userStreamKey,
      });
    } catch (error) {
      this.broker.writeLog(`保持用户数据流失败: ${error}`);
    }
  }

  /**
   * 查询历史数据
   */
  public async queryHistory(
    req: HistoryRequest,
    callback?: (bars: BarData[]) => void,
  ): Promise<BarData[]> {
    // Check if the contract exists
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      return [];
    }

    // Prepare history list
    const history: BarData[] = [];
    const limit = 1500;
    let startTime = dayjs(req.startDate).valueOf();
    let endTime = dayjs(req.endDate).valueOf();

    while (true) {
      // Create query parameters
      const params: any = {
        symbol: contract.name,
        interval: INTERVAL_VT2BINANCE[req.interval],
        limit,
        startTime,
        endTime,
      };

      let data;
      try {
        const response = await this.client.request({
          url: '/fapi/v1/klines',
          params, 
          retryCount: 10,
        });
        data = response.data;
      } catch (error) {
        throw new Error(`K线历史数据查询失败: ${error}`);
      }

      if (!data || data.length === 0) {
        const msg = `未接收到K线历史数据，起始时间: ${startTime}`;
        this.broker.writeLog(msg);
        break;
      }

      const buf: BarData[] = [];

      for (const row of data) {
        const bar: BarData = {
          symbol: req.symbol,
          timestamp: row[0],
          interval: req.interval,
          volume: Number.parseFloat(row[5]),
          open: Number.parseFloat(row[1]),
          high: Number.parseFloat(row[2]),
          low: Number.parseFloat(row[3]),
          close: Number.parseFloat(row[4]),
        };
        buf.push(bar);
      }

      const begin = dayjs(buf[0].timestamp).format('YYYY-MM-DD HH:mm:ss');
      const end = dayjs(buf[buf.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss');

      history.push(...buf);

      if (callback) {
        callback(buf);
      }

      this.broker.writeLog(`K线历史数据查询完成，${req.symbol} - ${req.interval}, ${begin} - ${end}`);

      const lastTimestamp = buf[buf.length - 1].timestamp;
      // Break the loop if the latest data received
      if (
        data.length < limit ||
        (lastTimestamp >= endTime)
      ) {
        break;
      }

      // Update query start time
      
      startTime = this.getNextStartTime(lastTimestamp, req.interval);

      // Wait to meet request flow limit
      await new Promise((resolve) => setTimeout(resolve, 500));
      
    }

    this.broker.writeLog(`K线历史数据查询完成，共${history.length}条数据`);

    return history;
  }

  /**
   * 停止REST API
   */
  public stop(): void {
    // 清理资源
  }

  /**
   * 查询单个订单
   */
  public async queryOrder(req: { symbol: string; orderId: string }): Promise<OrderData | null> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) return null;

    const params: Record<string, any> = { 
      symbol: contract.name,
      origClientOrderId: req.orderId,
    };

    try {
      const data = await this.sendSignedRequest('GET', '/fapi/v1/order', params);
      return this.mapOrder(data, req.symbol);
    } catch (error) {
      return null;
    }
  }

  /**
   * 查询历史订单列表
   */
  public async queryOrders(req: { symbol: string; startTime?: number; endTime?: number; limit?: number }): Promise<OrderData[]> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) return [];

    const params: Record<string, any> = { symbol: contract.name };
    if (req.startTime) params.startTime = req.startTime;
    if (req.endTime) params.endTime = req.endTime;
    if (req.limit) params.limit = req.limit;

    try {
      const list = await this.sendSignedRequest('GET', '/fapi/v1/allOrders', params);
      if (!Array.isArray(list)) return [];
      return list.map((o: any) => this.mapOrder(o, req.symbol));
    } catch (error) {
      this.broker.writeLog(`查询历史订单失败: ${error}`);
      return [];
    }
  }

  public async queryAssets(): Promise<AssetData[]> {
    try {
      const data = await this.sendSignedRequest('GET', '/fapi/v2/account');
      const list = Array.isArray(data?.assets) ? data.assets : [];
      return list.map((a: any) => ({
        assetName: String(a.asset),
        balance: Number(a.walletBalance),
        frozen: Number(a.walletBalance - a.availableBalance),
        available: Number(a.availableBalance),
      }));
    } catch (error) {
      this.broker.writeLog(`查询资产失败: ${error}`);
      return [];
    }
  }

  public async queryPositions(): Promise<PositionData[]> {
    try {
      const data = await this.sendSignedRequest('GET', '/fapi/v2/account');
      const list = Array.isArray(data?.positions) ? data.positions : [];
      return list
        .filter((p: any) => Number(p.positionAmt ?? 0) !== 0)
        .map((p: any) => {
          const contract = this.broker.getContractByName(String(p.symbol ?? ''));
          const symbol = contract?.symbol ?? '';
          return {
            direction: binance2direction(p.positionSide),
            pnl: Number(p.unrealizedProfit ?? 0),
            price: Number(p.entryPrice ?? 0),
            symbol,
            volume: Math.abs(Number(p.positionAmt ?? 0)),
            ydVolume: 0,
          } as PositionData;
        });
    } catch (error) {
      this.broker.writeLog(`查询仓位失败: ${error}`);
      return [];
    }
  }

  private getNextStartTime(timestamp: number, interval: Interval): number {
    const args = INTERVAL_VT2DAYJS[interval];
    const nextTime = dayjs(timestamp).add(...args);
    return nextTime.valueOf();
  }

  private mapOrder(order: any, symbol: string): OrderData {
    console.log(order);

    return {
      direction: binance2direction(order.positionSide),
      offset: binance2offset(order.positionSide, order.side),
      type: binance2ordertype(order.type),
      status: binance2status(order.status),
      orderId: order.clientOrderId,
      price: Number(order.price ?? 0),
      volume: Number(order.origQty ?? 0),
      avgPrice: Number(order.avgPrice ?? 0),
      traded: Number(order.executedQty ?? 0),
      tradePrice: 0,
      tradeVolume: 0,
      tradeCommission: 0,
      symbol: symbol,
      time: new Date(order.time),
      msg: '',
    };
  }

  /**
   * 查询合约信息
   */
  private async queryContract(): Promise<void> {
    try {
      const response = await this.client.request({
        url: '/fapi/v1/exchangeInfo'
      });
      const data = response.data;

      for (const symbolData of data.symbols) {
        if (symbolData.status !== 'TRADING') {
          continue;
        }

        const contract: ContractData = {
          symbol: `${symbolData.symbol}:${symbolData.marginAsset}`,
          name: symbolData.symbol,
          product: PRODUCT_BINANCE2VT[symbolData.contractType] || Product.FUTURES,
          priceTick: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'PRICE_FILTER')?.tickSize ||
              '0.01',
          ),
          minVolume: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'LOT_SIZE')?.minQty || '1',
          ),
          supportStopOrder: true,
          netPosition: true,
          supportHistory: true,
        };

        this.broker.onContract(contract);
      }

      this.broker.writeLog(`合约信息查询完成，共${data.symbols.length}个合约`);
    } catch (error) {
      this.broker.writeLog(`查询合约信息失败: ${error}`);
      throw error;
    }
  }

  /**
   * 查询服务器时间
   */
  private async queryTime(): Promise<void> {
    try {
      const response = await this.client.request({
        url: '/fapi/v1/time'
      });
      const serverTime = response.data.serverTime;
      const localTime = Date.now();
      this.broker.timeOffset = localTime - serverTime;
      this.broker.writeLog(`服务器时间同步完成，偏移: ${this.broker.timeOffset}ms`);
    } catch (error) {
      this.broker.writeLog(`查询服务器时间失败: ${error}`);
      throw error;
    }
  }

  /**
   * 发送签名请求
   */
  private async sendSignedRequest(
    method: 'DELETE' | 'GET' | 'POST' | 'PUT',
    path: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    const config: any = {
      method,
      url: path,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (method === 'GET') {
      config.params = params;
      config.paramsSerializer = () => this.sign(params);
    } else {
      config.data = this.sign(params);
    }

    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      const res = error.response?.data;
      const msg = res?.msg || error.message;
      this.broker.writeLog(`REST API请求失败: ${msg}`);
      throw error;
    }
  }

  /**
   * 签名请求
   */
  private sign(params: Record<string, any>): string {
    const timestamp = Date.now() - this.broker.timeOffset;
    params.timestamp = timestamp;

    const queryString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');

    return `${queryString}&signature=${signature}`;
  }

  /**
   * 启动用户数据流
   */
  private async startUserStream(): Promise<void> {
    try {
      const response = await this.sendSignedRequest('POST', '/fapi/v1/listenKey');
      this.userStreamKey = response.listenKey;
      this.broker.writeLog('用户数据流启动成功');
    } catch (error) {
      this.broker.writeLog(`启动用户数据流失败: ${error}`);
      throw error;
    }
  }
}

// ============================================================
// TradeApi (trade-api.ts)
// ============================================================

/**
 * 交易API客户端
 */
class TradeApi {
  private apiKey: string = '';
  private apiSecret: string = '';
  private broker: BinanceLinearBroker;
  private server: string = '';
  private ws: null | WebSocket = null;

  private orders: Map<string, OrderData> = new Map();

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到交易API
   */
  public async connect(apiKey: string, apiSecret: string): Promise<void> {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    return new Promise((resolve) => {
      try {
        this.ws = createWs({
          url: this.broker.TRADE_HOST,
          agent: createBinanceWsAgent(this.broker.TRADE_HOST),
          onOpen: () => {
            this.broker.writeLog('交易WebSocket连接成功');
            resolve();
          },
          onMessage: (_ws: WebSocket, data: WebSocket.Data) => {
            this.onMessage(data.toString());
          },
          onError: (_ws: WebSocket, error: Error) => {
            this.broker.writeLog(`交易WebSocket连接失败: ${error.message}（将继续运行，交易不可用）`);
            resolve();
          },
          onClose: () => {
            this.broker.writeLog('交易WebSocket连接关闭');
          },
        });
      } catch (err: unknown) {
        this.broker.writeLog(`交易WebSocket创建失败: ${(err as Error).message}（将继续运行，交易不可用）`);
        resolve();
      }
    });
  }

  /**
   * 签名参数
   */
  private sign(params: any): void {
    const timestamp = Date.now() - this.broker.timeOffset;
    params.timestamp = timestamp;

    const sortedKeys = Object.keys(params).sort();
    const payload = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');

    params.signature = signature;
  }

  /**
   * 发送订单
   */
  public async sendOrder(req: SendOrderRequest): Promise<string> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      this.broker.writeLog(`发送订单失败，未找到合约: ${req.symbol}`);
      return '';
    }

    const order: OrderData = {
      symbol: req.symbol,
      orderId: req.orderId,
      type: OrderType.LIMIT,
      direction: req.direction,
      offset: req.offset,
      price: req.price,
      volume: req.volume,
      avgPrice: 0,
      traded: 0,
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: new Date(),
      tradeCommission: 0,
      msg: '',
    };

    // 构建订单参数
    const params: any = {
      apiKey: this.apiKey,
      symbol: contract.name,
      positionSide: DIRECTION_OFFSET2BINANCE[req.direction],
      quantity: formatFloat(req.volume),
      newClientOrderId: req.orderId,
    };

    // 设置买卖方向
    if (req.direction === Direction.LONG) {
      params.side = req.offset === Offset.OPEN ? 'BUY' : 'SELL';
    } else {
      params.side = req.offset === Offset.OPEN ? 'SELL' : 'BUY';
    }

    // 设置订单类型和价格
    const orderType = OrderType.LIMIT;

    const [binanceType, timeCondition] = ORDERTYPE_VT2BINANCE[orderType];
    params.type = binanceType;
    params.timeInForce = timeCondition;
    params.price = formatFloat(req.price);

    // 签名参数
    this.sign(params);

    // 发送WebSocket消息
    const packet = {
      id: req.orderId,
      method: 'order.place',
      params: params,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
      this.broker.writeLog(`发送订单: ${req.symbol} ${req.direction} ${req.volume}`);

      this.broker.emit('order', order);
      this.orders.set(order.orderId, order);
    } else {
      this.broker.writeLog('WebSocket连接未建立，无法发送订单');
      return '';
    }

    return req.orderId;
  }

  /**
   * 撤销订单
   */
  public async cancelOrder(req: CancelOrderRequest): Promise<void> {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      this.broker.writeLog(`撤单失败，未找到合约: ${req.symbol}`);
      return;
    }

    // 构建撤单参数
    const params: any = {
      apiKey: this.apiKey,
      symbol: contract.name,
      origClientOrderId: req.orderId
    };

    // 签名参数
    this.sign(params);

    // 发送WebSocket消息
    const packet = {
      id: req.orderId,
      method: 'order.cancel',
      params: params,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
      this.broker.writeLog(`发送撤单请求: ${req.symbol} 订单ID: ${req.orderId}`);
    } else {
      this.broker.writeLog('WebSocket连接未建立，无法发送撤单请求');
    }
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
      const id = msg.id;

      // 处理异常情况
      if (msg.status !== 200) {
        const order = this.orders.get(id);

        if (order) {
          order.status = OrderStatus.REJECTED;
          order.msg = msg.error?.msg || '未知错误';
          this.broker.emit('order', order);
          this.orders.delete(id);
        }
      } else {
        this.orders.delete(id);
      }

    } catch (error) {
      this.broker.writeLog(`解析交易消息失败: ${error}`);
    }
  }
}

// ============================================================
// UserApi (user-api.ts)
// ============================================================

/**
 * 用户数据API客户端
 */
class UserApi {
  private broker: BinanceLinearBroker;
  private ws: null | WebSocket = null;

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到用户数据API
   */
  public async connect(listenKey: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(`${this.broker.USER_HOST}/${listenKey}`, {
          agent: createBinanceWsAgent(`${this.broker.USER_HOST}/${listenKey}`),
        });

        const connectTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.broker.writeLog('用户数据WebSocket连接超时（将继续运行，账户数据不可用）');
            resolve();
          }
        }, 10_000);

        this.ws.on('open', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('用户数据WebSocket连接成功');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.onMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          clearTimeout(connectTimeout);
          this.broker.writeLog(`用户数据WebSocket连接失败: ${error.message}（将继续运行，账户数据不可用）`);
          resolve();
        });

        this.ws.on('close', () => {
          this.broker.writeLog('用户数据WebSocket连接关闭');
        });
      } catch (err: unknown) {
        this.broker.writeLog(`用户数据WebSocket创建失败: ${(err as Error).message}（将继续运行，账户数据不可用）`);
        resolve();
      }
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

// ============================================================
// BinanceLinearBroker (broker.ts)
// ============================================================

/**
 * Binance线性合约网关
 */
export class BinanceLinearBroker extends Broker {
  REST_HOST = 'https://fapi.binance.com';
  TRADE_HOST = 'wss://ws-fapi.binance.com/ws-fapi/v1';
  USER_HOST = 'wss://fstream.binance.com/ws';
  DATA_HOST = 'wss://fstream.binance.com/stream';

  public timeOffset: number = 0;

  private restApi: RestApi;
  private mdApi: MdApi;
  private tradeApi: TradeApi;
  private userApi: UserApi;

  private orders: Map<string, OrderData> = new Map();
  private nameContractMap: Map<string, ContractData> = new Map();
  private symbolContractMap: Map<string, ContractData> = new Map();


  constructor() {
    super();
    this.restApi = new RestApi(this);
    this.tradeApi = new TradeApi(this);
    this.userApi = new UserApi(this);
    this.mdApi = new MdApi(this);
  }

  public getBrokerType(): BrokerType {
    return 'BINANCE_LINEAR';
  }

  /**
   * 连接到服务器
   */
  public async connect(settings: BrokerSettings): Promise<void> {
    const { apiKey, apiSecret } = settings;

    await Promise.all([
      this.restApi.connect(apiKey, apiSecret).then(() => {
        return this.userApi.connect(this.restApi.userStreamKey);
      }),

      this.tradeApi.connect(apiKey, apiSecret),
      this.mdApi.connect(),
    ]);

    this.writeLog('网关连接成功');
  }

  public getAllContracts(): ContractData[] {
    return [...this.nameContractMap.values()];
  }

  /**
   * 根据名称获取合约
   */
  public getContractByName(name: string): ContractData | undefined {
    return this.nameContractMap.get(name);
  }

  /**
   * 根据符号获取合约
   */
  public getContractBySymbol(symbol: string): ContractData | undefined {
    return this.symbolContractMap.get(symbol);
  }

  /**
   * 获取订单
   */
  public getOrder(orderId: string): OrderData | undefined {
    return this.orders.get(orderId);
  }

  /**
   * 处理账户数据
   */
  public onAsset(asset: AssetData): void {
    this.emit('asset', asset);
  }

  /**
   * 处理K线数据
   */
  public onBar(bar: BarData): void {
    this.emit('bar', bar);
  }

  /**
   * 处理合约数据
   */
  public onContract(contract: ContractData): void {
    this.symbolContractMap.set(contract.symbol, contract);
    this.nameContractMap.set(contract.name, contract);
    this.emit('contract', contract);
  }

  /**
   * 处理订单数据
   */
  public onOrder(order: OrderData): void {
    this.orders.set(order.orderId, { ...order });
    this.emit('order', order);
  }

  /**
   * 处理orderbook @TODO orderbook 与 tick 分开
   */
  public onOrderbook(orderbook: OrderbookData): void {
    this.emit('orderbook', orderbook);
  }

  /**
   * 处理持仓数据
   */
  public onPosition(position: PositionData): void {
    this.emit('position', position);
  }

  /**
   * 处理Tick数据
   */
  public onTick(tick: TickData): void {
    this.emit('tick', tick);
  }

  /**
   * 处理成交数据
   */
  public onTrade(trade: TradeData): void {
    this.emit('trade', trade);
  }

  /**
   * 查询历史数据
   */
  public async queryHistory(req: HistoryRequest): Promise<BarData[]> {
    return this.restApi.queryHistory(req);
  }

  /**
   * 发送订单
   */
  public sendOrder(req: SendOrderRequest): Promise<string> {
    return this.tradeApi.sendOrder(req);
  }

  /**
   * 撤销订单
   */
  public async cancelOrder(req: CancelOrderRequest): Promise<void> {
    return this.tradeApi.cancelOrder(req);
  }

  /**
   * 关闭连接
   */
  public stop(): void {
    this.restApi.stop();
    this.tradeApi.stop();
    this.userApi.stop();
    this.mdApi.stop();
    this.writeLog('网关连接已关闭');
  }

  /**
   * 订阅市场数据
   */
  public subscribeBar(req: SubscribeRequest): void {
    this.mdApi.subscribeBar(req);
  }

  /**
   * 取消订阅市场数据
   */
  public unsubscribeBar(req: SubscribeRequest): void {
    this.mdApi.unsubscribeBar(req);
  }

  /**
   * 写入日志
   */
  public writeLog(msg: string): void {
    console.log(`[${this.getBrokerType()}] ${msg}`);
    this.emit('log', msg);
  }

  /**
   * 监听K线数据
   */
  public watchBar(watcher: (bar: BarData) => void): void {
    this.on('bar', watcher);
  }

  public watchOrder(watcher: (order: OrderData) => void): ClearHandler {
    this.on('order', watcher);

    return () => {
      this.off('order', watcher);
    }
  }

  public watchTrade(watcher: (trade: TradeData) => void): ClearHandler {
    this.on('trade', watcher);

    return () => {
      this.off('trade', watcher);
    }
  }

  public refresh(bar: BarData): void {
  }
}

export default BinanceLinearBroker;
