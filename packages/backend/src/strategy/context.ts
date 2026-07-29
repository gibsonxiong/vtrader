import { Direction, Offset } from '../types/common';
import { SendOrderParams, CancelOrderParams, ContextProps } from '../types/strategy';
import { Strategy } from './strategy';
import { ArrayManger } from 'src/strategy/array-manager';
import { Position } from './position';
import { Asset } from './asset';

export class Context {
  strategy: Strategy;
  symbol: string;
  asset: Asset;
  longPos: Position;
  shortPos: Position;
  am: ArrayManger;

  constructor(props: ContextProps) {
    this.strategy = props.strategy;
    this.symbol = props.symbol;
    this.longPos = props.longPos;
    this.shortPos = props.shortPos;
    this.asset = props.asset;
    this.am = props.am;
  }

  sendOrder(params: Omit<SendOrderParams, 'orderId' | 'symbol'>): Promise<string> {
    return this.strategy.sendOrder({
      ...params,
      symbol: this.symbol,
    });
  }

  buy(params: Omit<SendOrderParams, 'orderId' | 'symbol' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      direction: Direction.LONG,
      offset: Offset.OPEN,
      ...params,
    });
  }

  sell(params: Omit<SendOrderParams, 'orderId' | 'symbol' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      direction: Direction.LONG,
      offset: Offset.CLOSE,
      ...params,
    });
  }

  short(params: Omit<SendOrderParams, 'orderId' | 'symbol' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      direction: Direction.SHORT,
      offset: Offset.OPEN,
      ...params,
    });
  }

  cover(params: Omit<SendOrderParams, 'orderId' | 'symbol' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      direction: Direction.SHORT,
      offset: Offset.CLOSE,
      ...params,
    });
  }

  cancelOrder(params: CancelOrderParams): Promise<void> {
    return this.strategy.cancelOrder(params);
  }

  cancelAllOrders(): Promise<void> {
    return this.strategy.cancelAllOrders({
      symbol: this.symbol
    });
  }

}

