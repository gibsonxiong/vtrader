import type { Direction, Interval, Offset, OrderType, BarData, OrderData } from './common';
import type { Strategy } from '../strategy/strategy';
import type { Asset } from '../strategy/asset';
import type { Position } from '../strategy/position';
import type { ArrayManger } from '../strategy/array-manager';

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

export type StrategyParamDTO = Record<string, { value: any; type: string }>;

export interface StrategyProps {
  engine: StrategyEngine;
  symbols: string[];
  assetBalance: number;
  assetName: string;
  setting?: Record<string, any>;
}

export interface RecordData {
  date: string;
  timestamp: number;
  totalValue: number;
}

export interface ParamConfig {
  type:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | FunctionConstructor
    | ObjectConstructor
    | ArrayConstructor;
  default?: any;
}

export interface CreateInstanceParam extends StrategyProps {
  name: string;
}

export interface StrategyConfig {
  name: string;
  strategyClass: new () => Strategy;
  paramConfigs: Record<string, ParamConfig>;
}

export interface ContextProps {
  strategy: Strategy;
  symbol: string;
  asset: Asset;
  longPos: Position;
  shortPos: Position;
  am: ArrayManger;
}

export interface Params {
  interval: Interval;
  callback: (bar: BarData) => void;
}

export interface WalletProps {
  total: number;
  assetName: string;
}

export interface Holding {
  symbol: string;
  direction: Direction;
  pos: number;
  price: number;
  initPrice: number;
  tradingPnl: number;
  accumTradingPnl: number;
  commission: number;
  turnover: number;
  frozenMap: Record<string, number>;
  frozen: number;
  available: number;

  calcFrozen(order: OrderData): void;
  update(order: OrderData): void;
  needProcessOrder(order: OrderData): boolean;
  calcTradingPnl(order: OrderData): number;
  getHoldingPnl(newPrice: number): number;
  getPnl(newPrice: number): number;
  getRoi(newPrice: number): number;
  toString(): string;
}


