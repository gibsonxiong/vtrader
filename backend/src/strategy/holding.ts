import { Direction, Offset } from 'src/types/common';
import type { TradeData } from 'src/types/common';

export interface Holding {
  pos: number;
  price: number;
  initPrice: number;
  tradingPnl: number;
  accumTradingPnl: number;
  commission: number;
  turnover: number;

  update(trade: TradeData): void;
  needProcessTrade(trade: TradeData): boolean;
  calcTradingPnl(trade: TradeData): number;
  getHoldingPnl(newPrice: number): number;
  getPnl(newPrice: number): number;
  getRoi(newPrice: number): number;
  toString(): string;
}

export class LongHolding implements Holding {
  public pos = 0;
  public price = 0;
  public initPrice = 0;
  public tradingPnl = 0;
  public accumTradingPnl = 0;
  public commission = 0;
  public turnover = 0;

  update(trade: TradeData): void {
    if (!this.needProcessTrade(trade)) return;

    // 开仓
    if (trade.offset === Offset.OPEN) {
      // 首次开仓
      if (this.initPrice === 0) {
        this.initPrice = trade.price;
        this.price = trade.price;
      } else {
        this.price = (this.price * this.pos + trade.price * trade.volume) / this.pos + trade.volume;
      }

      this.pos += trade.volume;
      this.commission += trade.commission;
      this.turnover += trade.price * trade.volume;
    }
    // 平仓
    else {
      const tradingPnl = this.calcTradingPnl(trade);
      this.pos -= trade.volume;
      this.tradingPnl += tradingPnl;
      this.accumTradingPnl += tradingPnl;
      this.commission += trade.commission;
      this.turnover += trade.price * trade.volume;

      if (this.pos === 0) {
        this.price = 0;
        this.initPrice = 0;
        this.tradingPnl = 0;
      }
    }
  }

  needProcessTrade(trade: TradeData): boolean {
    return trade.direction === Direction.LONG;
  }

  calcTradingPnl(trade: TradeData): number {
    return (trade.price - this.price) * trade.volume;
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
  public pos = 0;
  public price = 0;
  public initPrice = 0;
  public tradingPnl = 0;
  public accumTradingPnl = 0;
  public commission = 0;
  public turnover = 0;

  update(trade: TradeData): void {
    if (!this.needProcessTrade(trade)) return;

    // 开仓
    if (trade.offset === Offset.OPEN) {
      // 首次开仓
      if (this.initPrice === 0) {
        this.initPrice = trade.price;
        this.price = trade.price;
      } else {
        this.price = (this.price * this.pos + trade.price * trade.volume) / this.pos + trade.volume;
      }

      this.pos += trade.volume;
      this.commission += trade.commission;
      this.turnover += trade.price * trade.volume;
    }
    // 平仓
    else {
      const tradingPnl = this.calcTradingPnl(trade);
      this.pos -= trade.volume;
      this.tradingPnl += tradingPnl;
      this.accumTradingPnl += tradingPnl;
      this.commission += trade.commission;
      this.turnover += trade.price * trade.volume;

      if (this.pos === 0) {
        this.price = 0;
        this.initPrice = 0;
        this.tradingPnl = 0;
      }
    }
  }

  needProcessTrade(trade: TradeData): boolean {
    return trade.direction === Direction.SHORT;
  }

  calcTradingPnl(trade: TradeData): number {
    return (this.price - trade.price) * trade.volume;
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
