import type dayjs from 'dayjs';

import { Direction, Interval, OrderStatus, Product } from '@vtrader/shared';
import { OrderType } from '@vtrader/shared';

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
export const DIRECTION_OFFSET2BINANCE: Record<Direction, string> = {
  [Direction.LONG]: 'LONG',
  [Direction.SHORT]: 'SHORT',
};

// 订单类型映射
export const ORDERTYPE_VT2BINANCE: Record<OrderType, [string, string]> = {
  [OrderType.LIMIT]: ['LIMIT', 'GTC'],
  [OrderType.MARKET]: ['MARKET', 'GTC'],
  [OrderType.STOP]: ['STOP_MARKET', 'GTC'],
};

// 格式化浮点数函数
export function formatFloat(value: number): string {
  return value.toFixed(8).replace(/\.?0+$/, '');
}
