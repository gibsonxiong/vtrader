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
import { Broker } from '../../broker';
import { ReconnectingWebSocket } from './reconnecting-ws';

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
// onceRejectable
// ============================================================

/**
 * 将异步任务包装为“只执行一次，失败后允许重试”的可复用函数。
 */
export function onceRejectable<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): {
  run: (...args: A) => Promise<T>;
  reset: () => void;
} {
  let promise: Promise<T> | undefined;

  const run = (...args: A): Promise<T> => {
    if (!promise) {
      promise = fn(...args).catch((err) => {
        promise = undefined;
        throw err;
      });
    }
    return promise;
  };

  const reset = (): void => {
    promise = undefined;
  };

  return { run, reset };
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
  private ws: null | ReconnectingWebSocket = null;
  private connectOnce = onceRejectable(() => this.connect());
  private connected: boolean = false;

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到市场数据API
   */
  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new ReconnectingWebSocket(this.broker.DATA_HOST, {
          agent: createBinanceWsAgent(this.broker.DATA_HOST),
        });

        const connectTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.broker.writeLog('市场数据WebSocket连接超时（将继续运行，数据不可用）');
            reject(new Error('WebSocket connect timeout'));
          }
        }, 10_000);

        this.ws.on('open', () => {
          clearTimeout(connectTimeout);
          this.connected = true;
          this.broker.writeLog('市场数据WebSocket连接成功');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.onMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          this.broker.writeLog(`市场数据WebSocket连接失败: ${error.message}（将继续运行，数据不可用）`);
        });

        this.ws.on('failed', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('MdApi reconnect failed');
          reject(new Error('WebSocket reconnect failed'));
        });

        this.ws.on('close', () => {
          this.broker.writeLog('市场数据WebSocket连接关闭');
        });

        this.ws.on('reconnected', () => {
          this.broker.writeLog('市场数据WebSocket重连成功，恢复订阅...');
          this.restoreSubscriptions();
        });
      } catch (err: unknown) {
        this.broker.writeLog(`市场数据WebSocket创建失败: ${(err as Error).message}（将继续运行，数据不可用）`);
        reject(new Error('WebSocket create failed'));
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
    this.connectOnce.reset();
    this.connected = false;
  }

  public ensureConnected(): Promise<void> {
    return this.connectOnce.run();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * 重连后恢复订阅
   */
  private restoreSubscriptions(): void {
    for (const stream of this.subscriptions) {
      this.send('SUBSCRIBE', [stream]);
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
    const stream = `${symbol}@kline_${req.interval}`;

    this.subscriptions.add(stream);
    this.send('SUBSCRIBE', [stream]);
  }

  /**取消订阅*/
  public unsubscribeBar(req: SubscribeRequest): void {
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      return;
    }

    const symbol = contract.name.toLowerCase();

    // 如果启用K线流，取消订阅K线数据
    const stream = `${symbol}@kline_${req.interval}`;

    this.subscriptions.delete(stream);
    this.send('UNSUBSCRIBE', [stream]);
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
 * 创建 Binance REST 客户端
 */
export function createRestClient(host: string): Http {
  return createHttp({
    baseURL: host,
    proxy: false,
    ...createBinanceHttpAgents(),
  });
}

/**
 * 签名请求参数，返回带签名的查询字符串。
 */
export function sign(
  params: Record<string, any>,
  apiSecret: string,
  timeOffset: number,
): string {
  const signed: Record<string, any> = {
    ...params,
    timestamp: Date.now() - timeOffset,
  };

  const queryString = Object.keys(signed)
    .sort()
    .map((key) => `${key}=${signed[key]}`)
    .join('&');

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  return `${queryString}&signature=${signature}`;
}

/**
 * 发送签名请求
 */
export async function sendSignedRequest(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  method: 'DELETE' | 'GET' | 'POST' | 'PUT',
  path: string,
  params: Record<string, any> = {},
): Promise<any> {
  const config: any = {
    method,
    url: path,
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (method === 'GET') {
    config.params = params;
    config.paramsSerializer = () => sign(params, apiSecret, timeOffset);
  } else {
    config.data = sign(params, apiSecret, timeOffset);
  }

  try {
    const response = await client.request(config);
    return response.data;
  } catch (error) {
    const res = (error as any)?.response?.data;
    const msg = res?.msg || (error as Error).message;
    throw new Error(msg);
  }
}

/**
 * 查询服务器时间
 */
export async function queryTime(client: Http): Promise<number> {
  const response = await client.request({
    url: '/fapi/v1/time',
  });
  return response.data.serverTime as number;
}

/**
 * 查询合约信息
 */
export async function queryContract(client: Http): Promise<ContractData[]> {
  const response = await client.request({
    url: '/fapi/v1/exchangeInfo',
  });
  const data = response.data;

  const contracts: ContractData[] = [];

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

    contracts.push(contract);
  }

  return contracts;
}

/**
 * 查询历史数据
 */
export async function queryHistory(
  client: Http,
  req: HistoryRequest,
  symbolName: string,
  callback?: (bars: BarData[]) => void,
): Promise<BarData[]> {
  const history: BarData[] = [];
  const limit = 1500;
  let startTime = dayjs(req.startDate).valueOf();
  const endTime = dayjs(req.endDate).valueOf();

  while (true) {
    const params: any = {
      symbol: symbolName,
      interval: INTERVAL_VT2BINANCE[req.interval],
      limit,
      startTime,
      endTime,
    };

    let data;
    try {
      const response = await client.request({
        url: '/fapi/v1/klines',
        params,
        retryCount: 10,
      });
      data = response.data;
    } catch (error) {
      throw new Error(`K线历史数据查询失败: ${error}`);
    }

    if (!data || data.length === 0) {
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

    history.push(...buf);

    if (callback) {
      callback(buf);
    }

    const lastTimestamp = buf[buf.length - 1].timestamp;

    if (data.length < limit || lastTimestamp >= endTime) {
      break;
    }

    startTime = getNextStartTime(lastTimestamp, req.interval);

    // Wait to meet request flow limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return history;
}

/**
 * 启动用户数据流
 */
export async function startUserStream(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
): Promise<string> {
  const response = await sendSignedRequest(
    client,
    apiKey,
    apiSecret,
    timeOffset,
    'POST',
    '/fapi/v1/listenKey',
  );
  return response.listenKey as string;
}

function getNextStartTime(timestamp: number, interval: Interval): number {
  const args = INTERVAL_VT2DAYJS[interval];
  const nextTime = dayjs(timestamp).add(...args);
  return nextTime.valueOf();
}

// 以下为历史遗留查询逻辑，暂无调用方，保留以备后续使用。

function mapOrder(order: any, symbol: string): OrderData {
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

async function queryOrder(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  broker: BinanceLinearBroker,
  req: { symbol: string; orderId: string },
): Promise<OrderData | null> {
  const contract = broker.getContractBySymbol(req.symbol);
  if (!contract) return null;

  const params: Record<string, any> = {
    symbol: contract.name,
    origClientOrderId: req.orderId,
  };

  try {
    const data = await sendSignedRequest(
      client,
      apiKey,
      apiSecret,
      timeOffset,
      'GET',
      '/fapi/v1/order',
      params,
    );
    return mapOrder(data, req.symbol);
  } catch (error) {
    return null;
  }
}

async function queryOrders(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  broker: BinanceLinearBroker,
  req: { symbol: string; startTime?: number; endTime?: number; limit?: number },
): Promise<OrderData[]> {
  const contract = broker.getContractBySymbol(req.symbol);
  if (!contract) return [];

  const params: Record<string, any> = { symbol: contract.name };
  if (req.startTime) params.startTime = req.startTime;
  if (req.endTime) params.endTime = req.endTime;
  if (req.limit) params.limit = req.limit;

  try {
    const list = await sendSignedRequest(
      client,
      apiKey,
      apiSecret,
      timeOffset,
      'GET',
      '/fapi/v1/allOrders',
      params,
    );
    if (!Array.isArray(list)) return [];
    return list.map((o: any) => mapOrder(o, req.symbol));
  } catch (error) {
    broker.writeLog(`查询历史订单失败: ${error}`);
    return [];
  }
}

async function queryAssets(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  broker: BinanceLinearBroker,
): Promise<AssetData[]> {
  try {
    const data = await sendSignedRequest(
      client,
      apiKey,
      apiSecret,
      timeOffset,
      'GET',
      '/fapi/v2/account',
    );
    const list = Array.isArray(data?.assets) ? data.assets : [];
    return list.map((a: any) => ({
      assetName: String(a.asset),
      balance: Number(a.walletBalance),
      frozen: Number(a.walletBalance - a.availableBalance),
      available: Number(a.availableBalance),
    }));
  } catch (error) {
    broker.writeLog(`查询资产失败: ${error}`);
    return [];
  }
}

async function queryPositions(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  broker: BinanceLinearBroker,
): Promise<PositionData[]> {
  try {
    const data = await sendSignedRequest(
      client,
      apiKey,
      apiSecret,
      timeOffset,
      'GET',
      '/fapi/v2/account',
    );
    const list = Array.isArray(data?.positions) ? data.positions : [];
    return list
      .filter((p: any) => Number(p.positionAmt ?? 0) !== 0)
      .map((p: any) => {
        const contract = broker.getContractByName(String(p.symbol ?? ''));
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
    broker.writeLog(`查询仓位失败: ${error}`);
    return [];
  }
}

async function keepUserStream(
  client: Http,
  apiKey: string,
  apiSecret: string,
  timeOffset: number,
  broker: BinanceLinearBroker,
  state: { userStreamKey: string; keepAliveCount: number },
): Promise<void> {
  if (!state.userStreamKey) {
    return;
  }

  state.keepAliveCount++;
  if (state.keepAliveCount < 600) {
    return;
  }
  state.keepAliveCount = 0;

  try {
    await sendSignedRequest(
      client,
      apiKey,
      apiSecret,
      timeOffset,
      'PUT',
      '/fapi/v1/listenKey',
      {
        listenKey: state.userStreamKey,
      },
    );
  } catch (error) {
    broker.writeLog(`保持用户数据流失败: ${error}`);
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
  private ws: null | ReconnectingWebSocket = null;
  private connectOnce = onceRejectable(() => this.connect());

  private orders: Map<string, OrderData> = new Map();

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到交易API
   */
  public async connect(): Promise<void> {
    const credentials = this.broker.getCredentials();
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new ReconnectingWebSocket(this.broker.TRADE_HOST, {
          agent: createBinanceWsAgent(this.broker.TRADE_HOST),
        });

        const connectTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.broker.writeLog('交易WebSocket连接超时（将继续运行，交易不可用）');
            reject(new Error('WebSocket connect timeout'));
          }
        }, 10_000);

        this.ws.on('open', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('交易WebSocket连接成功');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.onMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          this.broker.writeLog(`交易WebSocket连接失败: ${error.message}（将继续运行，交易不可用）`);
        });

        this.ws.on('failed', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('交易WebSocket重连失败，已停止重试（交易不可用）');
          reject(new Error('WebSocket reconnect failed'));
        });

        this.ws.on('close', () => {
          this.broker.writeLog('交易WebSocket连接关闭');
        });
      } catch (err: unknown) {
        this.broker.writeLog(`交易WebSocket创建失败: ${(err as Error).message}（将继续运行，交易不可用）`);
        reject(new Error('WebSocket create failed'));
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
    this.connectOnce.reset();
  }

  public ensureConnected(): Promise<void> {
    return this.connectOnce.run();
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
  private ws: null | ReconnectingWebSocket = null;
  private listenKey: string = '';
  private connectOnce = onceRejectable((listenKey: string) => this.connect(listenKey));

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到用户数据API
   */
  public async connect(listenKey: string): Promise<void> {
    this.listenKey = listenKey;

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new ReconnectingWebSocket(`${this.broker.USER_HOST}/${listenKey}`, {
          agent: createBinanceWsAgent(`${this.broker.USER_HOST}/${listenKey}`),
        });

        const connectTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.broker.writeLog('用户数据WebSocket连接超时（将继续运行，账户数据不可用）');
            reject(new Error('WebSocket connect timeout'));
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
          this.broker.writeLog(`用户数据WebSocket连接失败: ${error.message}（将继续运行，账户数据不可用）`);
        });

        this.ws.on('failed', () => {
          clearTimeout(connectTimeout);
          this.broker.writeLog('用户数据WebSocket重连失败，已停止重试（账户数据不可用）');
          reject(new Error('WebSocket reconnect failed'));
        });

        this.ws.on('close', () => {
          this.broker.writeLog('用户数据WebSocket连接关闭');
        });
      } catch (err: unknown) {
        this.broker.writeLog(`用户数据WebSocket创建失败: ${(err as Error).message}（将继续运行，账户数据不可用）`);
        reject(new Error('WebSocket create failed'));
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
    this.listenKey = '';
    this.connectOnce.reset();
  }

  public ensureConnected(listenKey: string): Promise<void> {
    return this.connectOnce.run(listenKey);
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

  private restClient?: Http;
  public userStreamKey: string = '';
  private restConnectOnce = onceRejectable(() => this.doRestConnect());
  private userStreamOnce = onceRejectable(() => this.doUserStream());

  private mdApi: MdApi;
  private tradeApi: TradeApi;
  private userApi: UserApi;

  private orders: Map<string, OrderData> = new Map();
  private nameContractMap: Map<string, ContractData> = new Map();
  private symbolContractMap: Map<string, ContractData> = new Map();


  constructor() {
    super();
    this.tradeApi = new TradeApi(this);
    this.userApi = new UserApi(this);
    this.mdApi = new MdApi(this);
  }

  public getBrokerType(): BrokerType {
    return 'BINANCE_LINEAR';
  }

  private async ensureRestConnected(): Promise<void> {
    return this.restConnectOnce.run();
  }

  private async doRestConnect(): Promise<void> {
    const client = createRestClient(this.REST_HOST);

    const serverTime = await queryTime(client);
    this.timeOffset = Date.now() - serverTime;
    this.writeLog(`服务器时间同步完成，偏移: ${this.timeOffset}ms`);

    const contracts = await queryContract(client);
    for (const contract of contracts) {
      this.onContract(contract);
    }
    this.writeLog(`合约信息查询完成，共${contracts.length}个合约`);

    this.restClient = client;
    this.writeLog('REST API连接成功');
  }

  private async ensureUserStream(): Promise<void> {
    return this.userStreamOnce.run();
  }

  private async doUserStream(): Promise<void> {
    await this.ensureRestConnected();

    const credentials = this.getCredentials();
    const client = this.restClient!;

    const listenKey = await startUserStream(
      client,
      credentials.apiKey,
      credentials.apiSecret,
      this.timeOffset,
    );
    this.userStreamKey = listenKey;
    this.writeLog('用户数据流启动成功');
  }

  public async getAllContracts(): Promise<ContractData[]> {
    await this.ensureRestConnected();
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
    await this.ensureRestConnected();

    const contract = this.getContractBySymbol(req.symbol);
    if (!contract) {
      return [];
    }

    const client = this.restClient!;

    const bars = await queryHistory(client, req, contract.name, (buf) => {
      const begin = dayjs(buf[0].timestamp).format('YYYY-MM-DD HH:mm:ss');
      const end = dayjs(buf[buf.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss');
      this.writeLog(`K线历史数据查询完成，${req.symbol} - ${req.interval}, ${begin} - ${end}`);
    });

    this.writeLog(`K线历史数据查询完成，共${bars.length}条数据`);

    return bars;
  }

  /**
   * 发送订单
   */
  public async sendOrder(req: SendOrderRequest): Promise<string> {
    await this.ensureUserStream();
    await this.userApi.ensureConnected(this.userStreamKey);
    await this.tradeApi.ensureConnected();
    return this.tradeApi.sendOrder(req);
  }

  /**
   * 撤销订单
   */
  public async cancelOrder(req: CancelOrderRequest): Promise<void> {
    await this.ensureUserStream();
    await this.userApi.ensureConnected(this.userStreamKey);
    await this.tradeApi.ensureConnected();
    return this.tradeApi.cancelOrder(req);
  }

  /**
   * 关闭连接
   */
  public stop(): void {
    this.restConnectOnce.reset();
    this.userStreamOnce.reset();
    this.restClient = undefined;
    this.userStreamKey = '';
    this.tradeApi.stop();
    this.userApi.stop();
    this.mdApi.stop();
    this.writeLog('网关连接已关闭');
  }

  /**
   * 订阅市场数据
   */
  public async subscribeBar(req: SubscribeRequest): Promise<void> {
    await this.ensureRestConnected();
    await this.mdApi.ensureConnected();
    this.mdApi.subscribeBar(req);
  }

  /**
   * 取消订阅市场数据
   */
  public async unsubscribeBar(req: SubscribeRequest): Promise<void> {
    await this.ensureRestConnected();
    if (!this.mdApi.isConnected()) {
      return;
    }
    await this.mdApi.ensureConnected();
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
