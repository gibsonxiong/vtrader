import { BarData, Direction, Offset, OrderData, TickData, TradeData } from '../types/common';
import { LongHolding, ShortHolding } from './holding';
import { Wallet } from './wallet';

export interface StrategyEngine {
  cancelOrder(orderId: string): void;
  cancelStopOrder(stopOrderId: string): void;
  sendOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
  sendStopOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
}

export interface StrategyParams {
  assetTotal: number;
  assetName: string;
  engine: StrategyEngine;
  symbol: string;
  setting: any;
}

/**
 * 策略模板基类
 */
export abstract class Strategy {
  // 策略作者
  public author: string = '';

  public longHolding: LongHolding = new LongHolding();
  public shortHolding: ShortHolding = new ShortHolding();

  public wallet: Wallet = new Wallet();

  public inited: boolean = false;
  public trading: boolean = false;

  // 策略参数列表
  public parameters: string[] = [];
  public variables: string[] = [];
  // 策略变量列表

  // 引擎和基本信息
  protected engine: StrategyEngine;
  protected strategyName: string;
  protected symbol: string;

  constructor(params: StrategyParams) {
    this.engine = params.engine;
    this.symbol = params.symbol;

    this.wallet._assetName = params.assetName;
    this.wallet._total = params.assetTotal;

    // 从设置中更新参数
    this.updateSetting(params.setting);
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
   * 更新策略参数
   */
  private updateSetting(setting: any): void {
    for (const key in setting) {
      if (this.parameters.includes(key)) {
        (this as any)[key] = setting[key];
      }
    }
  }

  /**
   * 策略初始化
   */
  public onInit(): void {
    this.writeLog('策略初始化');
    this.inited = true;
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
   * Tick数据更新
   */
  public onTick(tick: TickData): void {
    // 子类可以重写
  }

  /**
   * K线数据更新
   */
  public onBar(bar: BarData): void {}

  /**
   * 委托状态更新
   */
  public _onOrder(order: OrderData): void {
    this.wallet.updateByOrder(order);

    this.onOrder(order);
  }

  /**
   * 委托状态更新
   */
  public onOrder(order: OrderData): void {
    // 默认实现，子类可以重写
  }

  /**
   * 停止单状态更新
   */
  public onStopOrder(stopOrder: OrderData): void {
    // 默认实现，子类可以重写
  }

  /**
   * 成交信息更新
   */
  public _onTrade(trade: TradeData): void {
    // 更新持仓
    this.longHolding.update(trade);
    this.shortHolding.update(trade);

    this.onTrade(trade);
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

    return this.engine.sendOrder(direction, offset, price, volume);
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

    return this.engine.sendStopOrder(direction, offset, price, volume);
  }

  /**
   * 撤销委托
   */
  protected cancelOrder(orderId: string): void {
    this.engine.cancelOrder(orderId);
  }

  /**
   * 撤销停止单
   */
  protected cancelStopOrder(stopOrderId: string): void {
    this.engine.cancelStopOrder(stopOrderId);
  }

  /**
   * 写入日志
   */
  protected writeLog(msg: string): void {
    console.log(`[${this.constructor.name}] ${msg}`);
  }
}
