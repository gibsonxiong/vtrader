import { Offset, OrderStatus } from '../types/common';
import type { OrderData } from '../types/common';
import { BigNumber } from 'bignumber.js';
import type { WalletProps } from '../types/strategy';

export class Wallet {
  _total: number;
  _assetName: string;

  frozenMap: Record<string, number> = {};

  constructor(props: WalletProps) {
    this._total = props.total;
    this._assetName = props.assetName;
  }

  get assetName(): string {
    return this._assetName;
  }

  get total(): number {
    return this._total;
  }

  get frozen(): number {
    return Object.values(this.frozenMap).reduce((prev, current) => prev.plus(current), BigNumber(0)).toNumber();
  }

  get available(): number {
    return BigNumber(this._total).minus(this.frozen).toNumber();
  }

  updateByOrder(order: OrderData): void {
    if (order.offset === Offset.OPEN) {
      switch (order.status) {
        case OrderStatus.SUBMITTING:
        case OrderStatus.NOTTRADED: {
          this.frozenMap[order.orderId] = BigNumber(order.volume).times(order.price).toNumber();

          break;
        }
        case OrderStatus.PARTTRADED: {
          const tradeAmount = BigNumber(order.tradePrice).times(order.tradeVolume);
          
          if (this.frozenMap[order.orderId]) {
            const frozen = BigNumber(this.frozenMap[order.orderId]);
            this.frozenMap[order.orderId] = frozen.minus(tradeAmount).toNumber();
          }
          this._total = BigNumber(this.total).minus(tradeAmount).minus(order.tradeCommission).toNumber();

          break;
        }
        case OrderStatus.ALLTRADED: {
          const tradeAmount = BigNumber(order.tradePrice).times(order.tradeVolume);

          delete this.frozenMap[order.orderId];
          this._total = BigNumber(this.total).minus(tradeAmount).minus(order.tradeCommission).toNumber();

          break;
        }
        case OrderStatus.CANCELLED: {
          delete this.frozenMap[order.orderId];

          break;
        }
        // No default
      }
    } else {
      const tradeAmount = BigNumber(order.tradePrice).times(order.tradeVolume);
      if (order.status === OrderStatus.PARTTRADED) {
        this._total = BigNumber(this.total).plus(tradeAmount).minus(order.tradeCommission).toNumber();
      } else if (order.status === OrderStatus.ALLTRADED) {
        this._total = BigNumber(this.total).plus(tradeAmount).minus(order.tradeCommission).toNumber();
      }
    }
  }

  public toString(): string {
    return `全部：${this.total} 可用：${this.available} 冻结：${this.frozen}`;
  }
}
