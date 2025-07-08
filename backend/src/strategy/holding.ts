import { Direction, Offset } from 'src/types/common';
import type { TradeData } from 'src/types/common';

export abstract class Holding {
  public pos: number = 0;
  public price: number = 0;
  public initPrice: number = 0;
  public tradingPnl: number = 0;

  update(trade: TradeData): void {
    if (!this._needProcessTrade(trade)) return;

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
    }
    // 平仓
    else {
      const tradingPnl = this._calcTradingPnl(trade);
      this.pos -= trade.volume;
      this.tradingPnl += tradingPnl;

      if (this.pos === 0) {
        this.price = 0;
        this.initPrice = 0;
      }
    }
  }

  abstract _needProcessTrade(trade: TradeData): boolean;

  abstract _calcTradingPnl(trade: TradeData): number;

  abstract getHoldingPnl(newPrice: number): number;

  abstract getPnl(newPrice: number): number;

  abstract getRoi(newPrice: number): number;

  public toString(): string {
    return `均价: ${this.price}, 持仓: ${this.pos}, 交易盈亏: ${this.tradingPnl}`;
  }
}

export class LongHolding extends Holding {
  _needProcessTrade(trade: TradeData): boolean {
    return trade.direction === Direction.LONG;
  }

  _calcTradingPnl(trade: TradeData): number {
    return (trade.price - this.price) * trade.volume;
  }

  getHoldingPnl(newPrice: number): number {
    return (newPrice - this.price) * this.pos;
  }

  getPnl(newPrice: number): number {
    return this.tradingPnl + this.getHoldingPnl(newPrice);
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return (newPrice - this.price) / this.price;
  }
}

export class ShortHolding extends Holding {
  _needProcessTrade(trade: TradeData): boolean {
    return trade.direction === Direction.SHORT;
  }

  _calcTradingPnl(trade: TradeData): number {
    return (this.price - trade.price) * trade.volume;
  }

  getHoldingPnl(newPrice: number): number {
    return (this.price - newPrice) * this.pos;
  }

  getPnl(newPrice: number): number {
    return this.tradingPnl + this.getHoldingPnl(newPrice);
  }

  getRoi(newPrice: number): number {
    if (this.initPrice === 0) return 0;
    return (this.price - newPrice) / this.price;
  }
}
