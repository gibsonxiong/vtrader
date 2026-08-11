import dayjs from 'dayjs';
import { BarData, Direction, Offset, OrderData, TickData, TradeData, OrderType, OrderStatus } from '../types/common';
import { DailyResultItem } from '../types/backtesting';
import { StrategyEngine, SendOrderParams, CancelOrderParams, StrategyProps, RecordData, ParamConfig } from '../types/strategy';
import { Context } from './context';
import { genOrderId, canOrderCancel, roundTo, calculateStd } from '../utils';
import { BigNumber } from 'bignumber.js';
import 'reflect-metadata';
import { Asset } from './asset';
import { Position } from './position';
import { ArrayManger } from './array-manager';

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
  // 引擎
  protected engine: StrategyEngine;

  public symbols: string[];
  public positions: Position[] = [];
  public assets: Asset[] = [];
  public orders: Map<string, OrderData> = new Map();
  public trades: TradeData[] = [];

  public ctxs: Map<string, Context>;

  public inited: boolean = false;
  public trading: boolean = false;

  public records: Map<string, RecordData> = new Map();
  public dailyResults: Map<string, DailyResultItem> = new Map();

  public startTotalValue: number = 0;

  preloadCount(): number {
    return 0;
  }

  amLength(): number {
    return 100;
  }

  _init(props: StrategyProps) {
    this.engine = props.engine;
    this.symbols = props.symbols;
    this.ctxs = new Map();

    // 从设置中更新参数
    this.initParams(props.setting);
    this.initCtxs(props);

    this.startTotalValue = this.calcTotalValue();
  }

  initCtxs(props: StrategyProps): void {
    const asset = new Asset(props.assetName, props.assetBalance);
    this.assets.push(asset);

    for (let symbol of this.symbols) {
      const longPos = new Position(symbol, Direction.LONG);
      const shortPos = new Position(symbol, Direction.SHORT);
      const am = new ArrayManger(this.amLength());

      const ctx = new Context({
        strategy: this,
        symbol,
        longPos,
        shortPos,
        asset,     // TODO 支持多资产
        am,
      });

      this.positions.push(longPos);
      this.positions.push(shortPos);
      this.ctxs.set(symbol, ctx);

      this.onInitContext(ctx);
    }
  }

  // initWallet(props: StrategyProps) {
  //   this.wallet = new Wallet({
  //     total: props.assetBalance,
  //     assetName: props.assetName,
  //   });
  // }

  onInitContext(ctx: Context) { }

  /**
   * 获取策略参数字典（静态方法，无需实例化）
   */
  public static getParamConfigs(): Record<string, ParamConfig> {
    const paramConfigs = Reflect.getMetadata(paramMetadataKey, this.prototype) || {};
    return paramConfigs;
  }

  /**
   * 获取策略参数字典
   */
  public getParamNames(): string[] {
    const paramConfigs = (this.constructor as typeof Strategy).getParamConfigs();
    const paramNames = Object.keys(paramConfigs);
    return paramNames;
  }

  /**
   * 更新策略参数
   */
  private initParams(setting?: Record<string, any>): void {
    const paramConfigs = (this.constructor as typeof Strategy).getParamConfigs();

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

  public onInit(): void { }

  /**
   * 策略启动
   */
  public start(): void {
    if (this.trading) return;

    this.writeLog('策略启动');
    this.onStart();
    this.trading = true;
  }
  public onStart(): void { }

  /**
   * 策略停止
   */
  public stop(): void {
    if (!this.trading) return;

    this.writeLog('策略停止');
    this.onStop();
    this.trading = false;
  }
  public onStop(): void { }

  /**
   * K线数据更新
   */
  public async handleBar(bar: BarData): Promise<void> {
    const ctx = this.ctxs.get(bar.symbol);
    if (!ctx) {
      return;
    }

    ctx.am.add(bar);
    ctx.longPos.updateByPrice(bar.close);
    ctx.shortPos.updateByPrice(bar.close);
    await this.onBar(bar, ctx);
  }
  public onBar(bar: BarData, ctx: Context): Promise<void> | void { }

  /**
   * 委托状态更新
   */
  public handleOrder(newOrder: OrderData): void {
    const order = this.orders.get(newOrder.orderId);
    if (!order) return;

    const ctx = this.ctxs.get(newOrder.symbol);
    if (!ctx) {
      return;
    }

    this.orders.set(order.orderId, newOrder);

    ctx.asset.updateByOrder(newOrder);
    ctx.longPos.updateByOrder(newOrder);
    ctx.shortPos.updateByOrder(newOrder);

    this.onOrder(newOrder, ctx);
  }

  /**
   * 委托状态更新
   */
  public onOrder(order: OrderData, ctx: Context): void { }

  /**
   * 成交信息更新
   */
  public handleTrade(trade: TradeData): void {
    if (!this.orders.has(trade.orderId)) return;

    const ctx = this.ctxs.get(trade.symbol);

    if (!ctx) {
      return;
    }

    this.trades.push(trade);

    ctx.asset.updateByTrade(trade);
    ctx.longPos.updateByTrade(trade);
    ctx.shortPos.updateByTrade(trade);

    this.onTrade(trade, ctx);
  }

  public onTrade(trade: TradeData, ctx: Context): void { }

  /**
   * 开-多仓
   */
  public buy(params: Omit<SendOrderParams, 'orderId' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      ...params,
      direction: Direction.LONG,
      offset: Offset.OPEN,
    });
  }

  /**
   * 平-多仓
   */
  public sell(params: Omit<SendOrderParams, 'orderId' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      ...params,
      direction: Direction.LONG,
      offset: Offset.CLOSE,
    });
  }

  /**
   * 开-空仓
   */
  public short(params: Omit<SendOrderParams, 'orderId' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      ...params,
      direction: Direction.SHORT,
      offset: Offset.OPEN,
    });
  }

  /**
   * 平-空仓
   */
  public cover(params: Omit<SendOrderParams, 'orderId' | 'direction' | 'offset'>): Promise<string> {
    return this.sendOrder({
      ...params,
      direction: Direction.SHORT,
      offset: Offset.CLOSE,
    });
  }

  /**
   * 发送委托
   */
  public async sendOrder(params: Omit<SendOrderParams, 'orderId'>): Promise<string> {
    const { symbol, direction, offset, price, volume } = params;

    const fixedPirce = roundTo(price, 0.1);
    const fixedVolume = roundTo(volume, 0.001);
    const fixedAmount = new BigNumber(fixedPirce * fixedVolume).toNumber();

    if (!this.trading) {
      // console.warn(`策略未开启`);
      return '';
      throw new Error('策略未开启');
    }

    const ctx = this.ctxs.get(symbol);

    if (!ctx) {
      // console.error('未找到该策略上下文');
      // return '';
      throw new Error('未找到该策略上下文');
    }

    if (offset === Offset.OPEN &&
      ctx.asset.available < fixedAmount
    ) {
      // console.error(`可用资金不足，无法下单[开${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用资金不足，无法下单[开${direction === Direction.LONG ? '多' : '空'}] [可用资金：${ctx.asset.available}， 下单金额：${fixedAmount}]`);
    }

    if (
      offset === Offset.CLOSE &&
      direction === Direction.LONG && ctx.longPos.available < fixedVolume
    ) {
      // console.error(`可用仓位不足，无法下单[平${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用仓位不足，无法下单[平多] [可用数量：${ctx.longPos.available}， 下单数量：${fixedVolume}]`);
    }

    if (
      offset === Offset.CLOSE &&
      direction === Direction.SHORT && ctx.shortPos.available < fixedVolume
    ) {
      // console.error(`可用仓位不足，无法下单[平${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用仓位不足，无法下单[平空] [可用资金：${ctx.shortPos.available}， 下单数量：${fixedVolume}]`);
    }

    const orderId = genOrderId();

    const order: OrderData = {
      symbol,
      orderId,
      type: OrderType.LIMIT,
      direction,
      offset,
      price: fixedPirce,
      volume: fixedVolume,
      avgPrice: 0,
      traded: 0,
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: new Date(),
      tradeCommission: 0,
      msg: '',
    };

    this.orders.set(orderId, order);
    this.handleOrder(order);

    await this.engine.sendOrder({
      orderId,
      symbol,
      direction,
      offset,
      price: fixedPirce,
      volume: fixedVolume,
    });

    return orderId;
  }

  /**
   * 撤销委托
   */
  public cancelOrder(params: CancelOrderParams): Promise<void> {
    return this.engine.cancelOrder(params);
  }

  /**
   * 撤销所有委托
   */
  public async cancelAllOrders(params: { symbol?: string }): Promise<void> {
    const { symbol } = params;
    for (let [orderId, order] of this.orders) {
      if (canOrderCancel(order)) continue;

      if (symbol && order.symbol !== symbol) continue;

      await this.cancelOrder({
        symbol: order.symbol,
        orderId
      });
    }
  }

  private calcTotalValue(): number {
    let totalValue = 0;

    for (const position of this.positions) {
      totalValue += position.value;
    }

    for (const asset of this.assets) {
      totalValue += asset.balance;
    }

    return totalValue;
  }

  doRecord(timestamp: number, price: number): void {
    const totalValue = this.calcTotalValue();
    const date = dayjs(timestamp).format('YYYY-MM-DD');
    const recordData = this.records.get(date);

    if (recordData) {
      // 更新当日收盘价
      recordData.timestamp = timestamp;
      // recordData.netPnl = netPnl;
      recordData.totalValue = totalValue;
    } else {
      this.records.set(date, {
        date,
        timestamp,
        // netPnl,
        totalValue,
      });
    }
  }


  /**
   * 计算每日结果
   */
  calculateDailyResult(): void {
    // 按日期分组交易记录
    const tradesByDate = new Map<string, TradeData[]>();

    for (const trade of this.trades) {
      const date = dayjs(trade.time).format('YYYY-MM-DD');
      if (!tradesByDate.has(date)) {
        tradesByDate.set(date, []);
      }
      tradesByDate.get(date)!.push(trade);
    }

    // 计算累计收益
    let prevRecord: RecordData | null = null;
    const dates = [...this.records.keys()].sort();

    for (const date of dates) {
      const record = this.records.get(date)!;
      const dayTrades = tradesByDate.get(date) || [];

      const netPnl = prevRecord
        ? record.totalValue - prevRecord.totalValue
        : record.totalValue - this.startTotalValue;

      const accumNetPnl = record.totalValue - this.startTotalValue;

      this.dailyResults.set(date, {
        date,
        trades: dayTrades,
        netPnl,
        accumNetPnl,
      });

      prevRecord = record;
    }
  }

  /**
   * 写入日志
   */
  protected writeLog(msg: string | string[]): void {
    // if (Array.isArray(msg)) {
    //   console.log(`[${this.constructor.name}]`);
    //   msg.forEach((m) => {
    //     console.log(m);
    //   });
    // } else {
    //   console.log(`[${this.constructor.name}] ${msg}`);
    // }

  }
}

