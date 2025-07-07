import type { Direction, Exchange, Interval, Offset, OrderType } from '../types/common';

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
  offset?: Offset;
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
  end?: string;
  interval: Interval;
  start: string;
  symbol: string;
}
