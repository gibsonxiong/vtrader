import type { OrderbookData } from '../backtesting-engine';

import * as crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as WebSocket from 'ws';

import {
  AccountData,
  BarData,
  Direction,
  OrderData,
  OrderStatus,
  OrderType,
  PositionData,
  TickData,
  TradeData,
} from '../backtesting-engine';

/**
 * 交易所枚举
 */
export enum Exchange {
  BINANCE = 'BINANCE',
}

/**
 * 产品类型枚举
 */
export enum Product {
  FUTURES = 'FUTURES',
  OPTION = 'OPTION',
  SPOT = 'SPOT',
  SWAP = 'SWAP',
}

/**
 * 时间间隔枚举
 */
export enum Interval {
  DAILY = '1d',
  HOUR = '1h',
  MINUTE = '1m',
}

/**
 * 合约数据接口
 */
export interface ContractData {
  exchange: Exchange;
  historyData: boolean;
  minVolume: number;
  name: string;
  netPosition: boolean;
  priceTick: number;
  product: Product;
  size: number;
  stopSupported: boolean;
  symbol: string;
}

/**
 * 订阅请求接口
 */
export interface SubscribeRequest {
  exchange: Exchange;
  symbol: string;
}

/**
 * 订单请求接口
 */
export interface OrderRequest {
  direction: Direction;
  exchange: Exchange;
  offset?: string;
  price?: number;
  reference?: string;
  symbol: string;
  type: OrderType;
  volume: number;
}

/**
 * 撤单请求接口
 */
export interface CancelRequest {
  exchange: Exchange;
  orderId: string;
  symbol: string;
}

/**
 * 历史数据请求接口
 */
export interface HistoryRequest {
  end: Date;
  exchange: Exchange;
  interval: Interval;
  start: Date;
  symbol: string;
}

// 服务器地址常量
const REAL_REST_HOST = 'https://fapi.binance.com';
const REAL_TRADE_HOST = 'wss://ws-fapi.binance.com/ws-fapi/v1';
const REAL_USER_HOST = 'wss://fstream.binance.com/ws/';
const REAL_DATA_HOST = 'wss://fstream.binance.com/stream';

const TESTNET_REST_HOST = 'https://testnet.binancefuture.com';
const TESTNET_TRADE_HOST = 'wss://testnet.binancefuture.com/ws-fapi/v1';
const TESTNET_USER_HOST = 'wss://stream.binancefuture.com/ws/';
const TESTNET_DATA_HOST = 'wss://stream.binancefuture.com/stream';

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
  [Interval.MINUTE]: '1m',
  [Interval.HOUR]: '1h',
  [Interval.DAILY]: '1d',
};

/**
 * 网关设置接口
 */
export interface GatewaySettings {
  apiKey: string;
  apiSecret: string;
  klineStream: boolean;
  proxyHost?: string;
  proxyPort?: number;
  server: 'REAL' | 'TESTNET';
}

/**
 * Binance线性合约网关
 */
@Injectable()
export class BinanceLinearGateway extends EventEmitter {
  public readonly exchange: Exchange = Exchange.BINANCE;
  public readonly gatewayName: string = 'BINANCE_LINEAR';

  private mdApi: MdApi;
  private nameContractMap: Map<string, ContractData> = new Map();
  private orders: Map<string, OrderData> = new Map();
  private restApi: RestApi;

  private symbolContractMap: Map<string, ContractData> = new Map();
  private tradeApi: TradeApi;
  private userApi: UserApi;

  constructor() {
    super();
    this.restApi = new RestApi(this);
    this.tradeApi = new TradeApi(this);
    this.userApi = new UserApi(this);
    this.mdApi = new MdApi(this);
  }

  /**
   * 撤销订单
   */
  public cancelOrder(req: CancelRequest): void {
    this.tradeApi.cancelOrder(req);
  }

  /**
   * 关闭连接
   */
  public close(): void {
    this.restApi.stop();
    this.tradeApi.stop();
    this.userApi.stop();
    this.mdApi.stop();
    this.writeLog('网关连接已关闭');
  }

  /**
   * 连接到服务器
   */
  public async connect(settings: GatewaySettings): Promise<void> {
    const { apiKey, apiSecret, server, klineStream, proxyHost, proxyPort } = settings;

    await this.restApi.connect(apiKey, apiSecret, server, proxyHost, proxyPort);
    await this.tradeApi.connect(apiKey, apiSecret, server, proxyHost, proxyPort);
    await this.mdApi.connect(server, klineStream, proxyHost, proxyPort);

    await this.userApi.connect(this.restApi.userStreamKey, server);

    this.writeLog('网关连接成功');
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
  public onAccount(account: AccountData): void {
    this.emit('account', account);
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
  public sendOrder(req: OrderRequest): string {
    return this.tradeApi.sendOrder(req);
  }

  /**
   * 订阅市场数据
   */
  public subscribe(req: SubscribeRequest): void {
    this.mdApi.subscribe(req);
  }

  /**
   * 写入日志
   */
  public writeLog(msg: string): void {
    console.log(`[${this.gatewayName}] ${msg}`);
    this.emit('log', msg);
  }
}

/**
 * REST API客户端
 */
class RestApi {
  public userStreamKey: string = '';
  private apiKey: string = '';
  private apiSecret: string = '';
  private client: AxiosInstance;
  private gateway: BinanceLinearGateway;
  private keepAliveCount: number = 0;
  private orderCount: number = 1_000_000;
  private orderPrefix: string = '';
  private server: string = '';
  private timeOffset: number = 0;

  constructor(gateway: BinanceLinearGateway) {
    this.gateway = gateway;
    this.client = axios.create();
  }

  /**
   * 连接到REST API
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

    const baseURL = server === 'REAL' ? REAL_REST_HOST : TESTNET_REST_HOST;
    this.client = axios.create({
      baseURL,
      // proxy: proxyHost && proxyPort ? {
      //   host: proxyHost,
      //   port: proxyPort,
      //   protocol: 'http'
      // } : undefined,
    });

    this.orderPrefix = new Date().toISOString().slice(2, 16).replaceAll(/[-T:]/g, '');

    // 查询服务器时间
    await this.queryTime();

    // 查询合约信息
    await this.queryContract();

    // 启动用户数据流
    await this.startUserStream();

    this.gateway.writeLog('REST API连接成功');
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
      this.gateway.writeLog(`保持用户数据流失败: ${error}`);
    }
  }

  /**
   * 查询历史数据
   */
  public async queryHistory(req: HistoryRequest): Promise<BarData[]> {
    const params = {
      symbol: this.gateway.getContractBySymbol(req.symbol)?.name || req.symbol,
      interval: INTERVAL_VT2BINANCE[req.interval],
      startTime: req.start.getTime(),
      endTime: req.end.getTime(),
      limit: 1500,
    };

    try {
      const response = await this.client.get('/fapi/v1/klines', { params });
      const bars: BarData[] = [];

      for (const data of response.data) {
        const bar: BarData = {
          symbol: req.symbol,
          datetime: new Date(data[0]),
          interval: req.interval,
          volume: Number.parseFloat(data[5]),
          openPrice: Number.parseFloat(data[1]),
          highPrice: Number.parseFloat(data[2]),
          lowPrice: Number.parseFloat(data[3]),
          closePrice: Number.parseFloat(data[4]),
        };
        bars.push(bar);
      }

      return bars;
    } catch (error) {
      this.gateway.writeLog(`查询历史数据失败: ${error}`);
      throw error;
    }
  }

  /**
   * 停止REST API
   */
  public stop(): void {
    // 清理资源
  }

  /**
   * 查询合约信息
   */
  private async queryContract(): Promise<void> {
    try {
      const response = await this.client.get('/fapi/v1/exchangeInfo');
      const data = response.data;

      for (const symbolData of data.symbols) {
        if (symbolData.status !== 'TRADING') {
          continue;
        }

        const contract: ContractData = {
          symbol: `${symbolData.symbol}:${symbolData.marginAsset}`,
          exchange: Exchange.BINANCE,
          name: symbolData.symbol,
          product: PRODUCT_BINANCE2VT[symbolData.contractType] || Product.FUTURES,
          size: 1,
          priceTick: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'PRICE_FILTER')?.tickSize ||
              '0.01',
          ),
          minVolume: Number.parseFloat(
            symbolData.filters.find((f: any) => f.filterType === 'LOT_SIZE')?.minQty || '1',
          ),
          stopSupported: true,
          netPosition: true,
          historyData: true,
        };

        this.gateway.onContract(contract);
      }

      this.gateway.writeLog(`合约信息查询完成，共${data.symbols.length}个合约`);
    } catch (error) {
      this.gateway.writeLog(`查询合约信息失败: ${error}`);
      throw error;
    }
  }

  /**
   * 查询服务器时间
   */
  private async queryTime(): Promise<void> {
    try {
      const response = await this.client.get('/fapi/v1/time');
      const serverTime = response.data.serverTime;
      const localTime = Date.now();
      this.timeOffset = localTime - serverTime;
      this.gateway.writeLog(`服务器时间同步完成，偏移: ${this.timeOffset}ms`);
    } catch (error) {
      this.gateway.writeLog(`查询服务器时间失败: ${error}`);
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
    const config: AxiosRequestConfig = {
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
      this.gateway.writeLog(`REST API请求失败: ${error}`);
      throw error;
    }
  }

  /**
   * 签名请求
   */
  private sign(params: Record<string, any>): string {
    const timestamp = Date.now() + this.timeOffset;
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
      this.gateway.writeLog('用户数据流启动成功');
    } catch (error) {
      this.gateway.writeLog(`启动用户数据流失败: ${error}`);
      throw error;
    }
  }
}

/**
 * 交易API客户端
 */
class TradeApi {
  private apiKey: string = '';
  private apiSecret: string = '';
  private gateway: BinanceLinearGateway;
  private orderCount: number = 1_000_000;
  private server: string = '';
  private ws: null | WebSocket = null;

  constructor(gateway: BinanceLinearGateway) {
    this.gateway = gateway;
  }

  /**
   * 撤销订单
   */
  public cancelOrder(req: CancelRequest): void {
    // 实现撤单逻辑
    const order = this.gateway.getOrder(req.orderId);
    if (order) {
      order.status = OrderStatus.CANCELLED;
      this.gateway.onOrder(order);
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
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.gateway.writeLog('交易WebSocket连接成功');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.onMessage(data.toString());
    });

    this.ws.on('error', (error) => {
      this.gateway.writeLog(`交易WebSocket错误: ${error}`);
    });

    this.ws.on('close', () => {
      this.gateway.writeLog('交易WebSocket连接关闭');
    });
  }

  /**
   * 发送订单
   */
  public sendOrder(req: OrderRequest): string {
    const orderId = `${this.orderCount++}`;

    // 这里应该实现实际的订单发送逻辑
    // 由于这是回测环境，我们只是模拟订单创建
    const order: OrderData = {
      symbol: req.symbol,
      exchange: req.exchange.toString(),
      orderId,
      type: req.type,
      direction: req.direction,
      offset: req.offset || 'open',
      price: req.price || 0,
      volume: req.volume,
      traded: 0,
      status: OrderStatus.SUBMITTING,
      time: new Date(),
    };

    this.gateway.onOrder(order);
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
      this.gateway.writeLog(`解析交易消息失败: ${error}`);
    }
  }
}

/**
 * 用户数据API客户端
 */
class UserApi {
  private gateway: BinanceLinearGateway;
  private ws: null | WebSocket = null;

  constructor(gateway: BinanceLinearGateway) {
    this.gateway = gateway;
  }

  /**
   * 连接到用户数据API
   */
  public async connect(listenKey: string, server: string): Promise<void> {
    const wsUrl = `${server === 'REAL' ? REAL_USER_HOST : TESTNET_USER_HOST}${listenKey}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.gateway.writeLog('用户数据WebSocket连接成功');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.onMessage(data.toString());
    });

    this.ws.on('error', (error) => {
      this.gateway.writeLog(`用户数据WebSocket错误: ${error}`);
    });

    this.ws.on('close', () => {
      this.gateway.writeLog('用户数据WebSocket连接关闭');
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

      this.gateway.onAccount(account);
    }

    // 处理持仓更新
    for (const position of data.P) {
      const pos: PositionData = {
        symbol: position.s,
        exchange: Exchange.BINANCE.toString(),
        direction: position.ps === 'LONG' ? Direction.LONG : Direction.SHORT,
        volume: Math.abs(Number.parseFloat(position.pa)),
        price: Number.parseFloat(position.ep),
        pnl: Number.parseFloat(position.up),
        frozen: 0,
        ydVolume: 0,
      };

      this.gateway.onPosition(pos);
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
      this.gateway.writeLog(`解析用户数据消息失败: ${error}`);
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
      direction: DIRECTION_BINANCE2VT[data.S],
      offset: data.ps === 'LONG' ? 'open' : 'close',
      price: Number.parseFloat(data.p),
      volume: Number.parseFloat(data.q),
      traded: Number.parseFloat(data.z),
      status: STATUS_BINANCE2VT[data.X],
      time: new Date(data.T),
    };

    this.gateway.onOrder(order);

    // 如果有成交，推送成交数据
    if (Number.parseFloat(data.l) > 0) {
      const trade: TradeData = {
        symbol: data.s,
        exchange: Exchange.BINANCE.toString(),
        orderId: data.c,
        tradeId: data.t.toString(),
        direction: DIRECTION_BINANCE2VT[data.S],
        offset: data.ps === 'LONG' ? 'open' : 'close',
        price: Number.parseFloat(data.L),
        volume: Number.parseFloat(data.l),
        time: new Date(data.T),
      };

      this.gateway.onTrade(trade);
    }
  }
}

/**
 * 市场数据API客户端
 */
class MdApi {
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
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.gateway.writeLog('市场数据WebSocket连接成功');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.onMessage(data.toString());
    });

    this.ws.on('error', (error) => {
      this.gateway.writeLog(`市场数据WebSocket错误: ${error}`);
    });

    this.ws.on('close', () => {
      this.gateway.writeLog('市场数据WebSocket连接关闭');
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
      datetime: new Date(kline.t),
      interval: '1m',
      volume: Number.parseFloat(kline.v),
      openPrice: Number.parseFloat(kline.o),
      highPrice: Number.parseFloat(kline.h),
      lowPrice: Number.parseFloat(kline.l),
      closePrice: Number.parseFloat(kline.c),
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

export default BinanceLinearGateway;
