import { BarData, Direction, Offset, OrderData, TickData, TradeData } from '../types/common';
import { LongHolding, ShortHolding } from './holding';
import { Wallet } from './wallet';
import 'reflect-metadata';

export interface StrategyEngine {
  cancelOrder(orderId: string): void;
  cancelStopOrder(stopOrderId: string): void;
  sendOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
  sendStopOrder(direction: Direction, offset: Offset, price: number, volume: number): string;
}

export interface StrategyProps {
  engine: StrategyEngine;
  symbol: string;
  balance: number;
  setting?: Record<string, any>;
}

export interface ParamConfig {
  type:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | FunctionConstructor
    | ObjectConstructor
    | ArrayConstructor;
  default?: any;
}

const paramMetadataKey = Symbol('param');

export function param(paramConfig: ParamConfig) {
  return (target: any, propertyKey: string) => {
    const paramConfigs: Record<string, ParamConfig> =
      Reflect.getMetadata(paramMetadataKey, target) || {};

    paramConfigs[propertyKey] = paramConfig;

    Reflect.defineMetadata(paramMetadataKey, paramConfigs, target);
  };
}

/**
 * 策略模板基类
 */
export abstract class Strategy {
  public longHolding: LongHolding = new LongHolding();
  public shortHolding: ShortHolding = new ShortHolding();
  public wallet: Wallet = new Wallet();

  public inited: boolean = false;
  public trading: boolean = false;

  // 引擎和基本信息
  protected engine: StrategyEngine;
  protected symbol: string;

  constructor(props: StrategyProps) {
    this.engine = props.engine;
    this.symbol = props.symbol;

    this.wallet._total = props.balance;

    // 从设置中更新参数
    this.initParams(props.setting);
  }

  /**
   * 获取策略参数字典
   */
  public getParamConfigs(): Record<string, ParamConfig> {
    const paramConfigs = Reflect.getMetadata(paramMetadataKey, this) || {};
    return paramConfigs;
  }

  /**
   * 获取策略参数字典
   */
  public getParamNames(): string[] {
    const paramConfigs = this.getParamConfigs();
    const paramNames = Object.keys(paramConfigs);
    return paramNames;
  }

  /**
   * 更新策略参数
   */
  private initParams(setting?: Record<string, any>): void {
    const paramConfigs = this.getParamConfigs();

    for (const name in paramConfigs) {
      (this as any)[name] = setting?.[name] || paramConfigs[name].default;
    }
  }

  /**
   * 策略初始化
   */
  public init(): void {
    this.writeLog('策略初始化');
    this.onInit();
    this.inited = true;
  }
  public onInit(): void {}

  /**
   * 策略启动
   */
  public start(): void {
    if (this.trading) return;

    this.writeLog('策略启动');
    this.onStart();
    this.trading = true;
  }
  public onStart(): void {}

  /**
   * 策略停止
   */
  public stop(): void {
    if (!this.trading) return;

    this.writeLog('策略停止');
    this.onStop();
    this.trading = false;
  }
  public onStop(): void {}

  /**
   * Tick数据更新
   */
  public onTick(tick: TickData): void {}

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
  public onOrder(order: OrderData): void {}

  /**
   * 停止单状态更新
   */
  public onStopOrder(stopOrder: OrderData): void {}

  /**
   * 成交信息更新
   */
  public _onTrade(trade: TradeData): void {
    // 更新持仓
    this.longHolding.update(trade);
    this.shortHolding.update(trade);

    this.onTrade(trade);
  }

  public onTrade(trade: TradeData): void {}

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
