import type { Direction, Interval, Offset, OrderType } from './common';

export interface SendOrderParams {
  orderId: string;
  symbol: string;
  direction: Direction;
  offset: Offset;
  price: number;
  volume: number;
}

export interface CancelOrderParams {
  orderId: string;
  symbol: string;
}

export interface StrategyEngine {
  sendOrder(params: SendOrderParams): Promise<string>;
  cancelOrder(params: CancelOrderParams): Promise<void>;
}
