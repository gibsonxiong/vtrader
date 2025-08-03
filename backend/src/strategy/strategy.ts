import * as dayjs from 'dayjs';
import { BarData, Direction, Offset, OrderData, TickData, TradeData, OrderType, OrderStatus } from '../types/common';
import { StrategyEngine, SendOrderParams, CancelOrderParams } from '../types/strategy';
import { Context } from './context';
import { LongHolding, ShortHolding } from './holding';
import { Wallet } from './wallet';
import { genOrderId, orderCanCancel } from 'src/utils';
import 'reflect-metadata';


export interface RecordData {
  date: string;
  // price: number;
  pnl: number;
  minPnl: number;
  maxPnl: number;
  tradingPnl: number;
  holdingPnl: number;
  commission: number;
  turnover: number;
}

export interface DailyResultItem {
  date: string;
  holdingPnl: number;
  netPnl: number;
  accumPnl: number;
  tradeCount: number;
  trades: TradeData[];
  tradingPnl: number;
  commission: number;
  turnover: number;
}

export interface BacktestingResult {
  annualReturn: number;
  dailyCommission: number;
  dailyNetPnl: number;
  dailyReturn: number;
  dailyTradeCount: number;
  dailyTurnover: number;
  startBalance: number;
  endBalance: number;
  endDate: string;
  lossDays: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  profitDays: number;
  returnDrawdownRatio: number;
  returnStd: number;
  sharpeRatio: number;
  startDate: string;
  totalCommission: number;
  totalDays: number;
  totalNetPnl: number;
  totalReturn: number;
  totalTradeCount: number;
  totalTurnover: number;
}

export interface StrategyProps {
  engine: StrategyEngine;
  symbols: string[];
  weight?: number;
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
  public wallet: Wallet = new Wallet();
  public symbols: string[];

  public inited: boolean = false;
  public trading: boolean = false;

  // 引擎和基本信息
  protected engine: StrategyEngine;
  public weight = 1;
  
  public ctxs: Map<string, Context>;
  public orders: Map<string, OrderData> = new Map();
  public trades: TradeData[] = [];
  public records: Map<string, RecordData> = new Map();
  public dailyResults: Map<string, DailyResultItem> = new Map();
  public backtestingResult: BacktestingResult | null = null;

  preloadCount(): number {
    return 0;
  }

  amLength(): number {
    return 100;
  }

  constructor(props: StrategyProps) {
    this.engine = props.engine;
    this.symbols = props.symbols;
    this.weight = props.weight || 1;
    this.ctxs = new Map();

    // 从设置中更新参数
    this.initParams(props.setting);

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
    }
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
   * K线数据更新
   */
  public handleBar(bar: BarData): void {
    const ctx = this.ctxs.get(bar.symbol);
    if (!ctx) {
      return;
    }
    
    if (ctx.am) {
      ctx.am.add(bar);
    }
    this.onBar(bar, ctx);
  }
  public onBar(bar: BarData, ctx: Context): void {}

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

  doRecord(timestamp: number, price: number): void {
    const date = dayjs(timestamp).format('YYYY-MM-DD');

    for (let [symbol, ctx] of this.ctxs) {
      const { longHolding, shortHolding } = ctx;
      const tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
      const holdingPnl = longHolding.getHoldingPnl(price) + shortHolding.getHoldingPnl(price);
      const pnl = tradingPnl + holdingPnl;
      const commission = longHolding.commission + shortHolding.commission;
      const turnover = longHolding.turnover + shortHolding.turnover;
      const recordData = this.records.get(date);
  
      if (recordData) {
        // 更新当日收盘价
        // recordData.price = price;
        recordData.pnl = pnl;
        recordData.holdingPnl = holdingPnl;
        recordData.tradingPnl = tradingPnl;
        recordData.commission = commission;
        recordData.turnover = turnover;
  
        // 更新最小最大PNL
        if (pnl < recordData.minPnl) {
          recordData.minPnl = pnl;
        }
  
        if (pnl > recordData.maxPnl) {
          recordData.maxPnl = pnl;
        }
      } else {
        this.records.set(date, {
          date,
          // price,
          pnl,
          minPnl: pnl,
          maxPnl: pnl,
          tradingPnl,
          holdingPnl,
          commission,
          turnover,
        });
      }
    }
    
  }

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

    if (!this.trading) {
      return '';
    }

    const ctx = this.ctxs.get(symbol);

    if (!ctx) {
      console.error('为找到该策略上下文');
      return '';
    }

    if (offset === Offset.OPEN && ctx.wallet.available < price * volume) {
      console.error(`可用资金不足，无法下单`);
      return '';
    }

    if (
      offset === Offset.CLOSE &&
      ((direction === Direction.LONG && ctx.longHolding.available < volume) ||
        (direction === Direction.SHORT && ctx.shortHolding.available < volume))
    ) {
      console.error(`[下单_开${direction === Direction.LONG ? '多' : '空'}]可用仓位不足，无法下单`);
      return '';
    }

    const orderId = genOrderId();

    const order: OrderData = {
      symbol,
      orderId,
      type: OrderType.LIMIT,
      direction,
      offset,
      price,
      volume,
      avgPrice: 0,
      traded: 0,
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: new Date(),
      tradeCommission: 0,
    };

    this.orders.set(orderId, order);
    this.handleOrder(order);

    await this.engine.sendOrder({
      orderId,
      symbol,
      direction,
      offset,
      price,
      volume,
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
      if (orderCanCancel(order)) continue;

      if (symbol && order.symbol !== symbol) continue;

      await this.cancelOrder({
        orderId,
        symbol: order.symbol,
      });
    }
  }

  /**
   * 写入日志
   */
  protected writeLog(msg: string): void {
    console.log(`[${this.constructor.name}] ${msg}`);
  }
}
