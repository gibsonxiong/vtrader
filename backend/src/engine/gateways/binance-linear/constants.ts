import type dayjs from 'dayjs';

import { Direction, Interval, OrderStatus, Product } from '../../types/common';

// 服务器地址常量
export const REAL_REST_HOST = 'https://fapi.binance.com';
export const REAL_TRADE_HOST = 'wss://ws-fapi.binance.com/ws-fapi/v1';
export const REAL_USER_HOST = 'wss://fstream.binance.com/ws/';
export const REAL_DATA_HOST = 'wss://fstream.binance.com/stream';

export const TESTNET_REST_HOST = 'https://testnet.binancefuture.com';
export const TESTNET_TRADE_HOST = 'wss://testnet.binancefuture.com/ws-fapi/v1';
export const TESTNET_USER_HOST = 'wss://stream.binancefuture.com/ws/';
export const TESTNET_DATA_HOST = 'wss://stream.binancefuture.com/stream';

// 状态映射
export const STATUS_BINANCE2VT: Record<string, OrderStatus> = {
  NEW: OrderStatus.NOTTRADED,
  PARTIALLY_FILLED: OrderStatus.PARTTRADED,
  FILLED: OrderStatus.ALLTRADED,
  CANCELED: OrderStatus.CANCELLED,
  REJECTED: OrderStatus.REJECTED,
  EXPIRED: OrderStatus.CANCELLED,
};

// 方向映射
export const DIRECTION_VT2BINANCE: Record<Direction, string> = {
  [Direction.LONG]: 'BUY',
  [Direction.SHORT]: 'SELL',
};

export const DIRECTION_BINANCE2VT: Record<string, Direction> = {
  BUY: Direction.LONG,
  SELL: Direction.SHORT,
};

// 产品映射
export const PRODUCT_BINANCE2VT: Record<string, Product> = {
  PERPETUAL: Product.SWAP,
  PERPETUAL_DELIVERING: Product.SWAP,
  CURRENT_MONTH: Product.FUTURES,
  NEXT_MONTH: Product.FUTURES,
  CURRENT_QUARTER: Product.FUTURES,
  NEXT_QUARTER: Product.FUTURES,
};

// K线间隔映射
export const INTERVAL_VT2BINANCE: Record<Interval, string> = {
  [Interval.MINUTE]: '1m',
  [Interval.MINUTE_5]: '5m',
  [Interval.MINUTE_15]: '15m',
  [Interval.MINUTE_30]: '30m',
  [Interval.HOUR]: '1h',
  [Interval.HOUR_2]: '2h',
  [Interval.HOUR_4]: '4h',
  [Interval.DAILY]: '1d',
  [Interval.WEEKLY]: '1w',
  [Interval.MONTHLY]: '1M',
};

export const INTERVAL_VT2DAYJS: Record<Interval, [number, dayjs.ManipulateType]> = {
  [Interval.MINUTE]: [1, 'm'],
  [Interval.MINUTE_5]: [5, 'm'],
  [Interval.MINUTE_15]: [15, 'm'],
  [Interval.MINUTE_30]: [30, 'm'],
  [Interval.HOUR]: [1, 'h'],
  [Interval.HOUR_2]: [2, 'h'],
  [Interval.HOUR_4]: [4, 'h'],
  [Interval.DAILY]: [1, 'd'],
  [Interval.WEEKLY]: [1, 'w'],
  [Interval.MONTHLY]: [1, 'M'],
};
