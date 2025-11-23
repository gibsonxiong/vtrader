import dayjs from 'dayjs';
import { BarData, Direction, Offset, OrderData, TickData, TradeData, OrderType, OrderStatus } from '@vtrader/shared';
import { StrategyEngine, SendOrderParams, CancelOrderParams } from '@vtrader/shared';
import { Context } from './context';
import { LongHolding, ShortHolding } from './holding';
import { Wallet } from './wallet';
import { genOrderId, canOrderCancel, roundTo, calculateStd } from 'src/utils';
import { BigNumber } from 'bignumber.js';
import 'reflect-metadata';


export interface RecordData {
  date: string;
  timestamp: number;
  netPnl: number;
}

export interface DailyResultItem {
  date: string;
  trades: TradeData[];
  netPnl: number;
  accumNetPnl: number;
  // holdingPnl: number;
  // tradeCount: number;
  // tradingPnl: number;
  // commission: number;
  // turnover: number;
}

export interface StrategyProps {
  engine: StrategyEngine;
  symbols: string[];
  assetBalance: number;
  assetName: string;
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
  public wallet: Wallet;
  public symbols: string[];

  public inited: boolean = false;
  public trading: boolean = false;

  // 引擎和基本信息
  protected engine: StrategyEngine;
  
  public ctxs: Map<string, Context>;
  public orders: Map<string, OrderData> = new Map();
  public trades: TradeData[] = [];
  public records: Map<string, RecordData> = new Map();
  public dailyResults: Map<string, DailyResultItem> = new Map();

  preloadCount(): number {
    return 0;
  }

  amLength(): number {
    return 100;
  }

  constructor(props: StrategyProps) {
    this.engine = props.engine;
    this.symbols = props.symbols;
    this.ctxs = new Map();

    // 从设置中更新参数
    this.initParams(props.setting);

    this.initWallet(props);
    this.initContexts();
  }

  initContexts(): void {
    for (let symbol of this.symbols) {
      const ctx = new Context({
        strategy: this,
        symbol,
        wallet: this.wallet,
        amLength: this.amLength(),
      });

      this.ctxs.set(symbol, ctx);

      this.onInitContext(ctx);
    }
  }

  initWallet(props: StrategyProps) {
    this.wallet = new Wallet({
      total: props.assetBalance,
      assetName: props.assetName,
    });
  }

  onInitContext(ctx: Context) {}

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
   * K线数据更新
   */
  public async handleBar(bar: BarData): Promise<void> {
    const ctx = this.ctxs.get(bar.symbol);
    if (!ctx) {
      return;
    }
    
    ctx.am.add(bar);
    await this.onBar(bar, ctx);
  }
  public onBar(bar: BarData, ctx: Context): Promise<void> | void {}

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

    ctx.wallet.updateByOrder(newOrder);
    ctx.longHolding.update(newOrder);
    ctx.shortHolding.update(newOrder);

    this.onOrder(newOrder, ctx);
  }

  /**
   * 委托状态更新
   */
  public onOrder(order: OrderData, ctx: Context): void {}

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
    this.onTrade(trade, ctx);
  }

  public onTrade(trade: TradeData, ctx: Context): void {}

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
      ctx.wallet.available < fixedAmount
    ) {
      // console.error(`可用资金不足，无法下单[开${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用资金不足，无法下单[开${direction === Direction.LONG ? '多' : '空'}] [可用资金：${ctx.wallet.available}， 下单金额：${fixedAmount}]`);
    }

    if (
      offset === Offset.CLOSE &&
      direction === Direction.LONG && ctx.longHolding.available < fixedVolume
    ) {
      // console.error(`可用仓位不足，无法下单[平${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用仓位不足，无法下单[平多] [可用数量：${ctx.longHolding.available}， 下单数量：${fixedVolume}]`);
    }

    if (
      offset === Offset.CLOSE &&
      direction === Direction.SHORT && ctx.shortHolding.available < fixedVolume
    ) {
      // console.error(`可用仓位不足，无法下单[平${direction === Direction.LONG ? '多' : '空'}]`);
      // return '';
      throw new Error(`可用仓位不足，无法下单[平空] [可用资金：${ctx.shortHolding.available}， 下单数量：${fixedVolume}]`);
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
  public async cancelAllOrders(params: {symbol?: string}): Promise<void> {
    const {symbol} = params;
    for (let [orderId, order] of this.orders) {
      if (canOrderCancel(order)) continue;

      if (symbol && order.symbol !== symbol) continue;

      await this.cancelOrder({
        symbol: order.symbol,
        orderId
      });
    }
  }

  doRecord(timestamp: number, price: number): void {
    let tradingPnl = 0;
    let holdingPnl = 0;
    let netPnl = 0;
    let commission = 0;

    for (let [symbol, ctx] of this.ctxs) {
      const { longHolding, shortHolding } = ctx;
      const _tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
      const _holdingPnl = longHolding.getHoldingPnl(price) + shortHolding.getHoldingPnl(price);

      tradingPnl += _tradingPnl;
      holdingPnl += _holdingPnl;
      commission += longHolding.commission + shortHolding.commission;
      netPnl += _tradingPnl + _holdingPnl - commission;
    }

    const date = dayjs(timestamp).format('YYYY-MM-DD');
    const recordData = this.records.get(date);
  
    if (recordData) {
      // 更新当日收盘价
      recordData.timestamp = timestamp;
      recordData.netPnl = netPnl;
    } else {
      this.records.set(date, {
        date,
        timestamp,
        netPnl,
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
    let accumNetPnl = 0;
    let prevRecord: RecordData | null = null;
    const dates = [...this.records.keys()].sort();

    for (const date of dates) {
      const record = this.records.get(date)!;
      const dayTrades = tradesByDate.get(date) || [];

      // 计算持仓盈亏（基于收盘价变化）
      // const tradingPnl = prevRecord
      //   ? record.tradingPnl - prevRecord.tradingPnl
      //   : record.tradingPnl;

      // const holdingPnl = prevRecord
      //   ? record.holdingPnl - prevRecord.holdingPnl
      //   : record.holdingPnl;

      // const commission = prevRecord
      //   ? record.commission - prevRecord.commission
      //   : record.commission;

      // const turnover = prevRecord 
      //   ? record.turnover - prevRecord.turnover
      //   : record.turnover;

      const netPnl = prevRecord 
        ? record.netPnl - prevRecord.netPnl
        : record.netPnl;

      // 累计总盈亏
      // accumNetPnl += record.netPnl;

      this.dailyResults.set(date, {
        date,
        trades: dayTrades,
        netPnl,
        accumNetPnl: record.netPnl,
      });

      prevRecord = record;
    }
  }

  /**
   * 写入日志
   */
  protected writeLog(msg: string | string[]): void {
    if (Array.isArray(msg)) {
      console.log(`[${this.constructor.name}]`);
      msg.forEach((m) => {
        console.log(m);
      });
    } else {
      console.log(`[${this.constructor.name}] ${msg}`);
    }

  }
}
