import { Direction, Offset } from 'src/shared/types/common';
import { SendOrderParams, CancelOrderParams } from 'src/shared/types/strategy';
import { LongHolding, ShortHolding } from './holding';
import { Wallet } from './wallet';
import { Strategy } from './strategy';
import { ArrayManger } from 'src/strategy/array-manager';

export interface ContextProps {
  strategy: Strategy;
  symbol: string;
  wallet: Wallet;
  amLength: number;
}

export class Context {
  strategy: Strategy;
  symbol: string;
  wallet: Wallet;
  longHolding: LongHolding;
  shortHolding: ShortHolding;
  am: ArrayManger;

  [key: string]: any;

  constructor(props: ContextProps) {
    this.strategy = props.strategy;
    this.symbol = props.symbol;
    this.wallet = props.wallet;
    this.longHolding = new LongHolding(props.symbol);
    this.shortHolding = new ShortHolding(props.symbol);
    this.am = new ArrayManger(props.amLength);
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

