import { Offset, OrderStatus } from 'src/types/common';
import type { OrderData } from 'src/types/common';

export class Wallet {
  frozenMap: Record<string, number> = {};

  constructor(
    public _total: number = 0,
    public _assetName: string = '',
  ) {}

  get assetName(): string {
    return this._assetName;
  }

  get total(): number {
    return this._total;
  }

  get frozen(): number {
    return Object.values(this.frozenMap).reduce((prev, current) => prev + current, 0);
  }

  get available(): number {
    return this._total - this.frozen;
  }

  // TODO 计算有误
  updateByOrder(order: OrderData): void {
    if (order.offset === Offset.OPEN) {
      switch (order.status) {
        case OrderStatus.NOTTRADED: {
          this.frozenMap[order.orderId] = order.volume * order.price;

          break;
        }
        case OrderStatus.PARTTRADED: {
          this.frozenMap[order.orderId] =
            order.volume * order.price - order.avgPrice * order.traded;
          this._total -= order.lastPrice * order.lastVolume;

          break;
        }
        case OrderStatus.ALLTRADED: {
          delete this.frozenMap[order.orderId];
          this._total -= order.lastPrice * order.lastVolume;

          break;
        }
        case OrderStatus.CANCELLED: {
          delete this.frozenMap[order.orderId];

          break;
        }
        // No default
      }
    } else {
      if (order.status === OrderStatus.PARTTRADED) {
        this._total += order.lastPrice * order.lastVolume;
      } else if (order.status === OrderStatus.ALLTRADED) {
        this._total += order.lastPrice * order.lastVolume;
      }
    }
  }

  // updateByTrade(trade: TradeData): void {
  //   if (trade.offset !== Offset.OPEN) return;
  //   const cost = trade.volume * trade.price;
  //   this._total -= cost;
  // }
}
