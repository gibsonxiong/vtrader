import type { Direction, Interval, Offset, OrderType } from './common';

export type BrokerType = 'BINANCE_LINEAR' | 'BINANCE_LINEAR_TESTNET';

export interface MockBrokerProps {
  brokerId: string;
  commissionRate: number;
  // BrokerClass: new () => Broker;
  assetName?: string;
  assetBalance: number;
  assetFrozen?: number;
}

export interface BrokerConfig {
  id: string;
  brokerType: BrokerType;
  settings: BrokerSettings;
}

/**
 * 网关设置接口
 */
export interface BrokerSettings {
  apiKey: string;
  apiSecret: string;
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
