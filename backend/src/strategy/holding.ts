import { Direction, Offset, OrderStatus } from 'src/types/common';
import type { OrderData } from 'src/types/common';

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
    return Object.values(this.frozenMap).reduce((acc, cur) => acc + cur, 0);
  }

  get available(): number {
    return this.pos - this.frozen;
  }

  update(order: OrderData): void {
    if (!this.needProcessOrder(order)) return;

    this.calcFrozen(order);

    if (order.status === OrderStatus.ALLTRADED || order.status === OrderStatus.PARTTRADED) {
      // 开仓
      if (order.offset === Offset.OPEN) {
        // 首次开仓
        if (this.initPrice === 0) {
          this.initPrice = order.tradePrice;
          this.price = order.tradePrice;
        } else {
          this.price = (this.price * this.pos + order.tradePrice * order.tradeVolume) / (this.pos + order.tradeVolume);
        }

        this.pos += order.tradeVolume;
        this.commission += order.tradeCommission;
        this.turnover += order.tradePrice * order.tradeVolume;
      }
      // 平仓
      else {
        const tradingPnl = this.calcTradingPnl(order);
        this.pos -= order.tradeVolume;
        this.tradingPnl += tradingPnl;
        this.accumTradingPnl += tradingPnl;
        this.commission += order.tradeCommission;
        this.turnover += order.tradePrice * order.tradeVolume;

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
        this.frozenMap[order.orderId] -= order.tradeVolume;
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
    return (order.tradePrice - this.price) * order.tradeVolume;
  }

  getHoldingPnl(newPrice: number): number {
    return (newPrice - this.price) * this.pos;
  }

  getPnl(newPrice: number): number {
    return this.accumTradingPnl + this.getHoldingPnl(newPrice);
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return (newPrice - this.price) / this.price;
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
    return Object.values(this.frozenMap).reduce((acc, cur) => acc + cur, 0);
  }

  get available(): number {
    return this.pos - this.frozen;
  }

  update(order: OrderData): void {
    if (!this.needProcessOrder(order)) return;

    this.calcFrozen(order);

    if (order.status === OrderStatus.ALLTRADED || order.status === OrderStatus.PARTTRADED) {
      // 开仓
      if (order.offset === Offset.OPEN) {
        // 首次开仓
        if (this.initPrice === 0) {
          this.initPrice = order.tradePrice;
          this.price = order.tradePrice;
        } else {
          this.price = (this.price * this.pos + order.tradePrice * order.tradeVolume) / (this.pos + order.tradeVolume);
        }

        this.pos += order.tradeVolume;
        this.commission += order.tradeCommission;
        this.turnover += order.tradePrice * order.tradeVolume;
      }
      // 平仓
      else {
        const tradingPnl = this.calcTradingPnl(order);
        this.pos -= order.tradeVolume;
        this.tradingPnl += tradingPnl;
        this.accumTradingPnl += tradingPnl;
        this.commission += order.tradeCommission;
        this.turnover += order.tradePrice * order.tradeVolume;

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
        this.frozenMap[order.orderId] -= order.tradeVolume;
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
    return (this.price - order.tradePrice) * order.tradeVolume;
  }

  getHoldingPnl(newPrice: number): number {
    return (this.price - newPrice) * this.pos;
  }

  getPnl(newPrice: number): number {
    return this.accumTradingPnl + this.getHoldingPnl(newPrice);
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return (this.price - newPrice) / this.price;
  }

  public toString(): string {
    return `均价: ${this.price}, 持仓: ${this.pos}, 交易盈亏: ${this.accumTradingPnl}`;
  }
}
