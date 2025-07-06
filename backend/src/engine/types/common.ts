/**
 * 订单状态枚举
 */
export enum OrderStatus {
  ALLTRADED = 'alltraded',
  CANCELLED = 'cancelled',
  NOTTRADED = 'nottraded',
  PARTTRADED = 'parttraded',
  REJECTED = 'rejected',
  SUBMITTING = 'submitting',
}

/**
 * 订单方向枚举
 */
export enum Direction {
  LONG = 'long',
  SHORT = 'short',
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market',
  STOP = 'stop',
}

/**
 * K线数据接口
 */
export interface BarData {
  close: number;
  high: number;
  interval: Interval;
  low: number;
  open: number;
  openInterest?: number;
  symbol: string;
  timestamp: number;
  volume: number;
}

/**
 * Tick数据接口
 */
export interface TickData {
  askPrice1: number;
  askPrice2: number;
  askPrice3: number;
  askPrice4: number;
  askPrice5: number;
  askVolume1: number;
  askVolume2: number;
  askVolume3: number;
  askVolume4: number;
  askVolume5: number;
  bidPrice1: number;
  bidPrice2: number;
  bidPrice3: number;
  bidPrice4: number;
  bidPrice5: number;
  bidVolume1: number;
  bidVolume2: number;
  bidVolume3: number;
  bidVolume4: number;
  bidVolume5: number;
  datetime: Date;
  highPrice: number;
  lastPrice: number;
  lastVolume: number;
  limit_down: number;
  limit_up: number;
  lowPrice: number;
  name: string;
  openPrice: number;
  preClose: number;
  symbol: string;
  volume: number;
}

export interface OrderbookData {
  asks: [string, string][];
  bids: [string, string][];
}

/**
 * 订单数据接口
 */
export interface OrderData {
  direction: Direction;
  exchange: string;
  offset: string;
  orderId: string;
  price: number;
  status: OrderStatus;
  symbol: string;
  time: Date;
  traded: number;
  type: OrderType;
  volume: number;
}

/**
 * 成交数据接口
 */
export interface TradeData {
  direction: Direction;
  exchange: string;
  offset: string;
  orderId: string;
  price: number;
  symbol: string;
  time: Date;
  tradeId: string;
  volume: number;
}

/**
 * 持仓数据接口
 */
export interface PositionData {
  direction: Direction;
  exchange: string;
  frozen: number;
  pnl: number;
  price: number;
  symbol: string;
  volume: number;
  ydVolume: number;
}

/**
 * 账户数据接口
 */
export interface AccountData {
  accountId: string;
  balance: number;
  frozen: number;
}

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
  HOUR_2 = '2h',
  HOUR_4 = '4h',
  MINUTE = '1m',
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  MINUTE_30 = '30m',
  MONTHLY = '1M',
  WEEKLY = '1w',
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
