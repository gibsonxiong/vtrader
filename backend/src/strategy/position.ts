import { Direction, Offset, OrderStatus, type OrderData, type TradeData } from "@vtrader/shared";
import { BigNumber } from 'bignumber.js';

export class Position {
  // 合约名称
  public symbol: string;
  // 持仓方向
  public direction: Direction;
  // 仓位大小
  public size = 0;
  // 平均价格
  public avgPrice = 0;
  // 开仓价格
  public price = 0;
  // 冻结仓位
  public frozen = 0;
  // 可用仓位
  public available = 0;
  // 当前持仓盈亏
  public pnl = 0;
  // 持仓收益率
  public roi = 0;
  // 仓位成本
  public cost = 0;
  // 仓位价值
  public value = 0;
  // 最新价格
  public newPrice = 0;

  public frozenMap: Record<string, number> = {};

  constructor(symbol: string, direction: Direction) {
    this.symbol = symbol;
    this.direction = direction;
  }

  updateByTrade(trade: TradeData): void {
    if (!this.needProcess(trade.symbol, trade.direction)) return;

    const { price, volume, offset } = trade;

    const amount = BigNumber(price).times(volume);

    // 开仓
    if (offset === Offset.OPEN) {
      const newSize = BigNumber(this.size).plus(volume).toNumber();

      // 首次开仓
      if (this.price === 0) {
        this.price = price;
        this.avgPrice = price;
      } else {
        this.avgPrice = BigNumber(this.avgPrice).times(this.size).plus(amount).div(newSize).toNumber();
      }

      this.size = newSize;
    }
    // 平仓
    else {
      const newSize = BigNumber(this.size).minus(volume).toNumber();
      this.size = newSize;

      if (this.size === 0) {
        this.price = 0;
        this.avgPrice = 0;
      }
    }

    this.cost = BigNumber(this.avgPrice).times(this.size).toNumber();

    if (this.newPrice === 0) this.newPrice = price;

    this.pnlAndRoi(this.newPrice);
  }

  updateByOrder(order: OrderData): void {
    if (!this.needProcess(order.symbol, order.direction)) return;
    if (this.size === 0) return;

    this.frozen = this.calcFrozen(order);
    this.available = BigNumber(this.size).minus(this.frozen).toNumber();
  }

  updateByPrice(newPrice: number): void {
    this.newPrice = newPrice;

    if (this.size === 0) return;

    this.pnlAndRoi(newPrice);
  }

  calcFrozen(order: OrderData): number {
    if (order.offset !== Offset.CLOSE) return 0;

    if (order.status === OrderStatus.SUBMITTING || order.status === OrderStatus.NOTTRADED) {
      this.frozenMap[order.orderId] = order.volume;
    } else if (order.status === OrderStatus.PARTTRADED) {
      if (this.frozenMap[order.orderId]) {
        this.frozenMap[order.orderId] = BigNumber(this.frozenMap[order.orderId]).minus(order.tradeVolume).toNumber();
      }
    } else if (order.status === OrderStatus.ALLTRADED) {
      delete this.frozenMap[order.orderId];
    } else if (order.status === OrderStatus.CANCELLED) {
      delete this.frozenMap[order.orderId];
    }

    return Object.values(this.frozenMap).reduce((prev, current) => prev.plus(current), BigNumber(0)).toNumber();
  }

  needProcess(symbol: string, direction: Direction): boolean {
    return symbol === this.symbol && direction === this.direction;
  }

  // calcOrderPnl(trade: TradeData): number {
  //   if (this.direction === Direction.LONG) {
  //     const diff = BigNumber(trade.price).minus(this.price);
  //     return diff.times(trade.volume).toNumber();
  //   } else {
  //     const diff = BigNumber(this.price).minus(trade.price);
  //     return diff.times(trade.volume).toNumber();
  //   }
  // }

  pnlAndRoi(newPrice: number): void {
    this.value = this.calcValue(newPrice);
    this.pnl = this.calcPnl(newPrice);
    this.roi = this.calcRoi(newPrice);
  }

  calcPnl(newPrice: number): number {
    if (this.direction === Direction.LONG) {
      const diff = BigNumber(newPrice).minus(this.avgPrice);
      return diff.times(this.size).toNumber();
    } else {
      const diff = BigNumber(this.avgPrice).minus(newPrice);
      return diff.times(this.size).toNumber();
    }
  }

  calcRoi(newPrice: number): number {
    if (this.size === 0) return 0;

    if (this.direction === Direction.LONG) {
      return BigNumber(newPrice).minus(this.avgPrice).div(this.avgPrice).toNumber();
    } else {
      return BigNumber(this.avgPrice).minus(newPrice).div(this.avgPrice).toNumber();
    }
  }

  calcValue(newPrice: number): number {
    return this.cost + this.calcPnl(newPrice);
  }

  public toString(): string {
    return `均价: ${this.avgPrice}, 持仓: ${this.size}, 交易盈亏: ${this.pnl}`;
  }
}
