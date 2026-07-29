import { Offset, OrderStatus } from '../types/common';
import type { OrderData, TradeData } from '../types/common';
import { BigNumber } from 'bignumber.js';

export class Asset {
  name: string;
  balance: number;
  frozen: number;
  available: number;

  frozenMap: Record<string, number> = {};

  constructor(name: string, balance: number) {
    this.name = name;
    this.balance = balance;
    this.available = balance;
    this.frozen = 0;
  }

  updateByOrder(order: OrderData): void {
    if (order.offset === Offset.OPEN) {
      switch (order.status) {
        case OrderStatus.SUBMITTING:
        case OrderStatus.NOTTRADED: {
          this.frozenMap[order.orderId] = BigNumber(order.volume).times(order.price).toNumber();

          break;
        }
        case OrderStatus.ALLTRADED: {
          delete this.frozenMap[order.orderId];
        
          break;
        }
        case OrderStatus.CANCELLED: {
          delete this.frozenMap[order.orderId];

          break;
        }
        default: {
          break;
        }
      }
    }

    this.frozen = this.getFrozen();
    this.available = this.getAvailable();
  }

  updateByTrade(trade: TradeData): void {
    const { offset, price, volume, commission, orderId } = trade;
    const tradeAmount = BigNumber(price).times(volume);

    if (offset === Offset.OPEN) {
      this.balance = BigNumber(this.balance).minus(tradeAmount).minus(commission).toNumber();

      if (this.frozenMap[orderId]) {
        const frozen = BigNumber(this.frozenMap[orderId]);
        this.frozenMap[orderId] = frozen.minus(tradeAmount).toNumber();
      }

    } else {
      this.balance = BigNumber(this.balance).plus(tradeAmount).minus(commission).toNumber();
    }

    this.frozen = this.getFrozen();
    this.available = this.getAvailable();
  }

    getFrozen(): number {
    return Object.values(this.frozenMap).reduce((prev, current) => prev.plus(current), BigNumber(0)).toNumber();
  }

  getAvailable(): number {
    return BigNumber(this.balance).minus(this.frozen).toNumber();
  }

  public toString(): string {
    return `[${this.name}] ${this.balance} / ${this.available}`;
  }
}
