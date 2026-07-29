import { Direction, Offset, OrderStatus } from '../types/common';
import type { OrderData } from '../types/common';
import { BigNumber } from 'bignumber.js';
import type { Holding } from '../types/strategy';

export class LongHolding implements Holding {
  public symbol: string;
  public direction = Direction.LONG;
  public pos = 0;
  public price = 0;
  public initPrice = 0;
  public tradingPnl = 0;
  public accumTradingPnl = 0;
  public commission = 0;
  public turnover = 0;
  public frozenMap: Record<string, number> = {};

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  get frozen(): number {
    return Object.values(this.frozenMap).reduce((prev, current) => prev.plus(current), BigNumber(0)).toNumber();
  }

  get available(): number {
    return BigNumber(this.pos).minus(this.frozen).toNumber();
  }

  update(order: OrderData): void {
    if (!this.needProcessOrder(order)) return;

    this.calcFrozen(order);

    if (order.status === OrderStatus.ALLTRADED || order.status === OrderStatus.PARTTRADED) {
      const tradeAmount = BigNumber(order.tradePrice).times(order.tradeVolume);

      // 开仓
      if (order.offset === Offset.OPEN) {
        const newPos = BigNumber(this.pos).plus(order.tradeVolume).toNumber();

        // 首次开仓
        if (this.initPrice === 0) {
          this.initPrice = order.tradePrice;
          this.price = order.tradePrice;
        } else {
          this.price = BigNumber(this.price).times(this.pos).plus(tradeAmount).div(newPos).toNumber();
        }

        this.pos = newPos;
        this.commission = BigNumber(this.commission).plus(order.tradeCommission).toNumber();
        this.turnover = BigNumber(this.turnover).plus(tradeAmount).toNumber();
      }
      // 平仓
      else {
        const newPos = BigNumber(this.pos).minus(order.tradeVolume).toNumber();

        const tradingPnl = this.calcTradingPnl(order);
        this.pos = newPos;
        this.tradingPnl = BigNumber(this.tradingPnl).plus(tradingPnl).toNumber() ;
        this.accumTradingPnl = BigNumber(this.accumTradingPnl).plus(tradingPnl).toNumber();
        this.commission = BigNumber(this.commission).plus(order.tradeCommission).toNumber();
        this.turnover = BigNumber(this.turnover).plus(tradeAmount).toNumber();

        if (this.pos === 0) {
          this.price = 0;
          this.initPrice = 0;
          this.tradingPnl = 0;
        }
      }
    }
  }

  calcFrozen(order: OrderData): void {
    if (order.offset !== Offset.CLOSE) return;

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
  }

  needProcessOrder(order: OrderData): boolean {
    return order.direction === Direction.LONG;
  }

  calcTradingPnl(order: OrderData): number {
    const diff = BigNumber(order.tradePrice).minus(this.price);
    return diff.times(order.tradeVolume).toNumber();
  }

  getHoldingPnl(newPrice: number): number {
    const diff = BigNumber(newPrice).minus(this.price);
    return diff.times(this.pos).toNumber();
  }

  getPnl(newPrice: number): number {
    return BigNumber(this.accumTradingPnl).plus(this.getHoldingPnl(newPrice)).toNumber();
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return BigNumber(this.price).minus(newPrice).div(this.price).toNumber();
  }

  public toString(): string {
    return `均价: ${this.price}, 持仓: ${this.pos}, 交易盈亏: ${this.accumTradingPnl}`;
  }
}

export class ShortHolding implements Holding {
  public symbol: string;
  public direction = Direction.SHORT;
  public pos = 0;
  public price = 0;
  public initPrice = 0;
  public tradingPnl = 0;
  public accumTradingPnl = 0;
  public commission = 0;
  public turnover = 0;
  public frozenMap: Record<string, number> = {};

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  get frozen(): number {
    return Object.values(this.frozenMap).reduce((prev, current) => prev.plus(current), BigNumber(0)).toNumber();
  }

  get available(): number {
    return BigNumber(this.pos).minus(this.frozen).toNumber();
  }

  update(order: OrderData): void {
    if (!this.needProcessOrder(order)) return;

    this.calcFrozen(order);

    if (order.status === OrderStatus.ALLTRADED || order.status === OrderStatus.PARTTRADED) {
      const tradeAmount = BigNumber(order.tradePrice).times(order.tradeVolume);

      // 开仓
      if (order.offset === Offset.OPEN) {
        const newPos = BigNumber(this.pos).plus(order.tradeVolume).toNumber();

        // 首次开仓
        if (this.initPrice === 0) {
          this.initPrice = order.tradePrice;
          this.price = order.tradePrice;
        } else {
          this.price = BigNumber(this.price).times(this.pos).plus(tradeAmount).div(newPos).toNumber();
        }

        this.pos = newPos;
        this.commission = BigNumber(this.commission).plus(order.tradeCommission).toNumber();
        this.turnover = BigNumber(this.turnover).plus(tradeAmount).toNumber();
      }
      // 平仓
      else {
        const newPos = BigNumber(this.pos).minus(order.tradeVolume).toNumber();

        const tradingPnl = this.calcTradingPnl(order);
        this.pos = newPos;
        this.tradingPnl = BigNumber(this.tradingPnl).plus(tradingPnl).toNumber() ;
        this.accumTradingPnl = BigNumber(this.accumTradingPnl).plus(tradingPnl).toNumber();
        this.commission = BigNumber(this.commission).plus(order.tradeCommission).toNumber();
        this.turnover = BigNumber(this.turnover).plus(tradeAmount).toNumber();

        if (this.pos === 0) {
          this.price = 0;
          this.initPrice = 0;
          this.tradingPnl = 0;
        }
      }
    }
  }

  calcFrozen(order: OrderData): void {
    if (order.offset !== Offset.CLOSE) return;

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
  }

  needProcessOrder(order: OrderData): boolean {
    return order.direction === Direction.SHORT;
  }

  calcTradingPnl(order: OrderData): number {
    const diff = BigNumber(this.price).minus(order.tradePrice);
    return diff.times(order.tradeVolume).toNumber();
  }

  getHoldingPnl(newPrice: number): number {
    const diff = BigNumber(this.price).minus(newPrice);
    return diff.times(this.pos).toNumber();
  }

  getPnl(newPrice: number): number {
    return BigNumber(this.accumTradingPnl).plus(this.getHoldingPnl(newPrice)).toNumber();
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return BigNumber(this.price).minus(newPrice).div(this.price).toNumber();
  }

  public toString(): string {
    return `均价: ${this.price}, 持仓: ${this.pos}, 交易盈亏: ${this.accumTradingPnl}`;
  }
}
