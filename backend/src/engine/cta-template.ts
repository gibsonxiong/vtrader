import { BarData, Direction, Offset, OrderData, TickData, TradeData } from './types/common';

export interface Broker {
  cancelOrder(orderId: string): void;
  cancelStopOrder(stopOrderId: string): void;
  sendOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
  sendStopOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
}

/**
 * CTA策略模板基类
 * 参考vnpy的CtaTemplate实现
 */
export abstract class CtaTemplate {
  // 策略作者
  public author: string = '';

  // 策略实例变量
  public inited: boolean = false;

  // 策略参数列表
  public parameters: string[] = [];
  public pos: number = 0;

  public trading: boolean = false;
  public variables: string[] = [];
  // 策略变量列表

  // 引擎和基本信息
  protected broker: Broker;
  protected setting: any;
  protected strategyName: string;
  protected vtSymbol: string;

  constructor(ctaEngine: Broker, strategyName: string, vtSymbol: string, setting: any) {
    this.broker = ctaEngine;
    this.strategyName = strategyName;
    this.vtSymbol = vtSymbol;
    this.setting = setting;

    // 从设置中更新参数
    this.updateSetting(setting);
  }

  /**
   * 成交信息更新
   */
  public _onTrade(trade: TradeData): void {
    // 更新持仓
    if (trade.direction === Direction.LONG) {
      this.pos += trade.offset === Offset.OPEN ? trade.volume : -trade.volume;
    } else {
      this.pos += trade.offset === Offset.OPEN ? -trade.volume : trade.volume;
    }

    this.onTrade(trade);
  }

  /**
   * 获取策略参数字典
   */
  public getParameters(): any {
    const params: any = {};
    for (const key of this.parameters) {
      params[key] = (this as any)[key];
    }
    return params;
  }

  /**
   * 获取策略变量字典
   */
  public getVariables(): any {
    const variables: any = {};
    for (const key of this.variables) {
      variables[key] = (this as any)[key];
    }
    return variables;
  }

  /**
   * K线数据更新
   */
  public onBar(bar: BarData): void {}

  /**
   * 策略初始化
   */
  public onInit(): void {
    this.writeLog('策略初始化');
    this.inited = true;
  }

  /**
   * 委托状态更新
   */
  public onOrder(order: OrderData): void {
    // 默认实现，子类可以重写
  }

  /**
   * 策略启动
   */
  public onStart(): void {
    this.writeLog('策略启动');
    this.trading = true;
  }

  /**
   * 策略停止
   */
  public onStop(): void {
    this.writeLog('策略停止');
    this.trading = false;
  }

  /**
   * 停止单状态更新
   */
  public onStopOrder(stopOrder: OrderData): void {
    // 默认实现，子类可以重写
  }

  /**
   * Tick数据更新
   */
  public onTick(tick: TickData): void {
    // 子类可以重写
  }

  public onTrade(trade: TradeData): void {
    // 默认实现，子类可以重写
  }

  /**
   * 开-多仓
   */
  protected buy(price: number, volume: number): null | string {
    return this.sendOrder(Direction.LONG, Offset.OPEN, price, volume);
  }

  /**
   * 平-多仓
   */
  protected sell(price: number, volume: number): null | string {
    return this.sendOrder(Direction.LONG, Offset.CLOSE, price, volume);
  }

  /**
   * 开-空仓
   */
  protected short(price: number, volume: number): null | string {
    return this.sendOrder(Direction.SHORT, Offset.OPEN, price, volume);
  }

  /**
   * 平-空仓
   */
  protected cover(price: number, volume: number): null | string {
    return this.sendOrder(Direction.SHORT, Offset.CLOSE, price, volume);
  }

  /**
   * 发送委托
   */
  protected sendOrder(
    direction: Direction,
    offset: Offset,
    price: number,
    volume: number,
  ): null | string {
    if (!this.trading) {
      return null;
    }

    return this.broker.sendOrder(direction, offset, price, volume);
  }

  /**
   * 发送停止单
   */
  protected sendStopOrder(
    direction: Direction,
    offset: Offset,
    price: number,
    volume: number,
  ): null | string {
    if (!this.trading) {
      return null;
    }

    return this.broker.sendStopOrder(direction, offset, price, volume);
  }

  /**
   * 撤销委托
   */
  protected cancelOrder(orderId: string): void {
    this.broker.cancelOrder(orderId);
  }

  /**
   * 撤销停止单
   */
  protected cancelStopOrder(stopOrderId: string): void {
    this.broker.cancelStopOrder(stopOrderId);
  }

  /**
   * 写入日志
   */
  protected writeLog(msg: string): void {
    console.log(`[${this.strategyName}] ${msg}`);
  }

  /**
   * 更新策略参数
   */
  private updateSetting(setting: any): void {
    for (const key in setting) {
      if (this.parameters.includes(key)) {
        (this as any)[key] = setting[key];
      }
    }
  }
}

/**
 * 技术指标计算工具类
 */
export const TechnicalIndicators = {
  /**
   * 简单移动平均线
   */
  sma(data: number[], period: number): number[] {
    const result: number[] = [];

    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }

    return result;
  },

  /**
   * 指数移动平均线
   */
  ema(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    // 第一个值使用SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    result.push(sum / period);

    // 后续值使用EMA公式
    for (let i = period; i < data.length; i++) {
      const ema = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
      result.push(ema);
    }

    return result;
  },

  /**
   * 布林带
   */
  bollinger(
    data: number[],
    period: number,
    std: number = 2,
  ): {
    lower: number[];
    middle: number[];
    upper: number[];
  } {
    const middle = this.sma(data, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = period - 1; i < data.length; i++) {
      // 计算标准差
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += (data[j] - middle[i - period + 1]) ** 2;
      }
      const stdDev = Math.sqrt(sum / period);

      upper.push(middle[i - period + 1] + std * stdDev);
      lower.push(middle[i - period + 1] - std * stdDev);
    }

    return { upper, middle, lower };
  },

  /**
   * RSI相对强弱指标
   */
  rsi(data: number[], period: number = 14): number[] {
    const gains: number[] = [];
    const losses: number[] = [];

    // 计算涨跌幅
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(change < 0 ? -change : 0);
    }

    const result: number[] = [];

    // 计算RSI
    for (let i = period - 1; i < gains.length; i++) {
      let avgGain = 0;
      let avgLoss = 0;

      for (let j = i - period + 1; j <= i; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }

      avgGain /= period;
      avgLoss /= period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(rsi);
    }

    return result;
  },

  /**
   * MACD指标
   */
  macd(
    data: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ): {
    histogram: number[];
    macd: number[];
    signal: number[];
  } {
    const fastEma = this.ema(data, fastPeriod);
    const slowEma = this.ema(data, slowPeriod);

    // 计算MACD线
    const macd: number[] = [];
    const startIndex = slowPeriod - fastPeriod;

    for (let i = 0; i < fastEma.length - startIndex; i++) {
      macd.push(fastEma[i + startIndex] - slowEma[i]);
    }

    // 计算信号线
    const signal = this.ema(macd, signalPeriod);

    // 计算柱状图
    const histogram: number[] = [];
    const signalStartIndex = signalPeriod - 1;

    for (const [i, element] of signal.entries()) {
      histogram.push(macd[i + signalStartIndex] - element);
    }

    return { macd, signal, histogram };
  },

  /**
   * KDJ指标
   */
  kdj(
    high: number[],
    low: number[],
    close: number[],
    period: number = 9,
    k: number = 3,
    d: number = 3,
  ): {
    d: number[];
    j: number[];
    k: number[];
  } {
    const rsv: number[] = [];

    // 计算RSV
    for (let i = period - 1; i < close.length; i++) {
      let highestHigh = high[i - period + 1];
      let lowestLow = low[i - period + 1];

      for (let j = i - period + 2; j <= i; j++) {
        if (high[j] > highestHigh) highestHigh = high[j];
        if (low[j] < lowestLow) lowestLow = low[j];
      }

      const rsvValue =
        highestHigh === lowestLow ? 50 : ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      rsv.push(rsvValue);
    }

    // 计算K值
    const kValues: number[] = [];
    let prevK = 50;

    for (const rsvValue of rsv) {
      const kValue = (prevK * (k - 1) + rsvValue) / k;
      kValues.push(kValue);
      prevK = kValue;
    }

    // 计算D值
    const dValues: number[] = [];
    let prevD = 50;

    for (const kValue of kValues) {
      const dValue = (prevD * (d - 1) + kValue) / d;
      dValues.push(dValue);
      prevD = dValue;
    }

    // 计算J值
    const jValues: number[] = [];
    for (const [i, kValue] of kValues.entries()) {
      jValues.push(3 * kValue - 2 * dValues[i]);
    }

    return {
      k: kValues,
      d: dValues,
      j: jValues,
    };
  },
};
