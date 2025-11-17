import type { Direction, Interval, Offset, OrderType } from './common';

/**
 * 网关设置接口
 */
export interface BrokerSettings {
  apiKey: string;
  apiSecret: string;
  // klineStream: boolean;
  // proxyHost?: string;
  // proxyPort?: number;
  // server: 'REAL' | 'TESTNET';
}

/**
 * 订阅请求接口
 */
export interface SubscribeRequest {
  symbol: string;
  interval: Interval;
}

/**
 * 订单请求接口
 */
export interface SendOrderRequest {
  orderId: string;
  symbol: string;
  direction: Direction;
  offset: Offset;
  price: number;
  volume: number;
}

/**
 * 撤单请求接口
 */
export interface CancelOrderRequest {
  orderId: string;
  symbol: string;
}

/**
 * 历史数据请求接口
 */
export interface HistoryRequest {
  symbol: string;
  startDate: string;
  endDate?: string;
  interval: Interval;
}

export type ClearHandler = () => void;
