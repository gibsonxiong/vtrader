import {
  BarData,
  Offset,
  OrderData,
  TickData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
} from '../types/common';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';

import { Strategy } from './strategy';
import { MarketDataService } from '../market-data/market-data.service';
import { StrategyService } from './strategy.service';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  startDate: string;
  endDate: string;
  symbol: string;
  interval: Interval;
  balance: number;
  commissionRate: number;
  size: number;
  priceTick: number;
  mode: BacktestingMode;
  strategy: {
    strategyName: string;
    strategySetting?: Record<string, any>;
  };
}

/**
 * 回测模式枚举
 */
export enum BacktestingMode {
  BAR = 'bar', // K线回测
}

/**
 * 回测结果统计接口
 */
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

export interface Snapshot {
  date: string;
  price: number;
  pnl: number;
  minPnl: number;
  maxPnl: number;
  tradingPnl: number;
  holdingPnl: number;
  commission: number;
  turnover: number;
}

/**
 * CTA回测引擎
 */
@Injectable()
export class BacktestingService {
  private exchange: string;
  private symbol: string;
  private interval: Interval;
  private mode: BacktestingMode = BacktestingMode.BAR;
  private priceTick: number = 0; // 最小价格变动
  private commissionRate: number;
  private size: number = 1; // 合约大小
  private startDate: string;
  private endDate: string;
  private balance: number;

  private activeLimitOrders: Map<string, OrderData> = new Map();
  private limitOrders: Map<string, OrderData> = new Map();
  private limitOrderCount: number = 0;
  private activeStopOrders: Map<string, OrderData> = new Map();
  private stopOrders: Map<string, OrderData> = new Map();
  private stopOrderCount: number = 0;
  private tradeCount: number = 0;
  private trades: TradeData[] = [];

  private strategy: Strategy;
  private datetime: Date;
  private tick: TickData;
  private bar: BarData;
  private historyData: (BarData | TickData)[] = [];

  private snapshots: Map<string, Snapshot> = new Map();
  private dailyResults: Map<string, DailyResultItem> = new Map();

  private logs: string[] = [];

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly strategyService: StrategyService,
  ) {}

  /**
   * 设置回测参数
   */
  setSetting(setting: BacktestingSetting): void {
    this.startDate = setting.startDate;
    this.endDate = setting.endDate;
    this.symbol = setting.symbol;
    this.interval = setting.interval;
    this.balance = setting.balance;
    this.commissionRate = setting.commissionRate;
    this.size = setting.size;
    this.priceTick = setting.priceTick;
    this.mode = setting.mode;
  }

  /**
   * 添加策略
   */
  async addStrategy(strategyName: string, setting: any): Promise<void> {
    const strategy = await this.strategyService.createInstance(strategyName, {
      engine: this,
      symbol: this.symbol,
      balance: this.balance,
      setting,
    });

    if (!strategy) {
      throw new Error('未找到该策略，策略创建失败');
    }

    this.strategy = strategy;
  }

  /**
   * 撤销订单
   */
  cancelOrder(orderId: string): void {
    if (this.activeLimitOrders.has(orderId)) {
      const order = this.activeLimitOrders.get(orderId);
      if (order) {
        order.status = OrderStatus.CANCELLED;
        this.activeLimitOrders.delete(orderId);
        this.strategy._onOrder(order);
      }
    }
  }

  /**
   * 撤销停止单
   */
  cancelStopOrder(stopOrderId: string): void {
    if (this.activeStopOrders.has(stopOrderId)) {
      const stopOrder = this.activeStopOrders.get(stopOrderId);
      if (stopOrder) {
        stopOrder.status = OrderStatus.CANCELLED;

        this.activeStopOrders.delete(stopOrderId);
        this.strategy.onStopOrder(stopOrder);
      }
    }
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.output('开始加载历史数据');

    if (this.mode === BacktestingMode.BAR) {
      // 从数据库加载K线数据
      // 这里需要根据实际的数据库结构来实现
      const bars = await this.marketDataService.getBars({
        symbol: this.symbol,
        interval: this.interval,
        start: this.startDate,
        end: this.endDate,
      });
      this.historyData = bars;
    }

    this.output(`历史数据加载完成，数据量：${this.historyData.length}`);
  }

  /**
   * 运行回测
   */
  runBacktesting(): void {
    this.output('开始运行回测');

    if (!this.strategy) {
      this.output('请先添加策略');
      return;
    }

    // if (this.historyData.length === 0) {
    //   this.output('请先加载历史数据');
    //   return;
    // }

    // 调用策略初始化
    this.strategy.init();
    this.output('策略初始化完成');

    // 调用策略启动
    this.strategy.start();
    this.output('策略启动完成');

    this.output('开始回放历史数据');

    // 遍历历史数据
    for (const data of this.historyData) {
      if (this.mode === BacktestingMode.BAR) {
        this.newBar(data as BarData);
      } else {
        this.newTick(data as TickData);
      }
    }
    this.strategy.stop();

    this.output('历史数据回放结束');
  }

  async backtesting(setting: BacktestingSetting): Promise<void> {
    const { strategyName, strategySetting } = setting.strategy;

    this.setSetting(setting);

    await this.addStrategy(strategyName, strategySetting);

    await this.loadData();

    this.runBacktesting();
    this.calculateResult(true);
  }

  /**
   * 发送限价单
   */
  sendOrder(direction: Direction, offset: Offset, price: number, volume: number): string {
    const orderId = `${this.limitOrderCount}`;
    this.limitOrderCount++;

    const order: OrderData = {
      symbol: this.symbol,
      exchange: this.exchange,
      orderId,
      type: OrderType.LIMIT,
      direction,
      offset,
      price,
      volume,
      avgPrice: 0,
      traded: 0,
      lastPrice: 0,
      lastVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: this.datetime,
    };

    this.limitOrders.set(orderId, order);
    this.activeLimitOrders.set(orderId, order);

    return orderId;
  }

  /**
   * 发送停止单
   */
  sendStopOrder(direction: Direction, offset: Offset, price: number, volume: number): string {
    const stopOrderId = `${this.stopOrderCount}`;
    this.stopOrderCount++;

    const stopOrder: OrderData = {
      symbol: this.symbol,
      exchange: this.exchange,
      orderId: stopOrderId,
      type: OrderType.STOP,
      direction,
      offset,
      price,
      volume,
      avgPrice: 0,
      traded: 0,
      lastPrice: 0,
      lastVolume: 0,
      status: OrderStatus.NOTTRADED,
      time: this.datetime,
    };

    this.stopOrders.set(stopOrderId, stopOrder);
    this.activeStopOrders.set(stopOrderId, stopOrder);

    return stopOrderId;
  }

  /**
   * 限价单撮合
   */
  private crossLimitOrder(): void {
    let longCrossPrice: number;
    let shortCrossPrice: number;
    let longBestPrice: number;
    let shortBestPrice: number;

    if (this.mode === BacktestingMode.BAR) {
      longCrossPrice = this.bar.low;
      shortCrossPrice = this.bar.high;
      longBestPrice = this.bar.open;
      shortBestPrice = this.bar.open;
    } else {
      longCrossPrice = this.tick.askPrice1;
      shortCrossPrice = this.tick.bidPrice1;
      longBestPrice = longCrossPrice;
      shortBestPrice = shortCrossPrice;
    }

    for (const [orderId, order] of this.activeLimitOrders) {
      // 推送委托进入未成交队列的更新状态
      if (order.status === OrderStatus.SUBMITTING) {
        order.status = OrderStatus.NOTTRADED;
        this.strategy._onOrder(order);
      }

      // 判断是否会成交
      const longCross =
        order.direction === Direction.LONG && order.price >= longCrossPrice && longCrossPrice > 0;

      const shortCross =
        order.direction === Direction.SHORT &&
        order.price <= shortCrossPrice &&
        shortCrossPrice > 0;

      if (!longCross && !shortCross) {
        continue;
      }

      // 计算成交价格
      const tradePrice = longCross
        ? Math.min(order.price, longBestPrice)
        : Math.max(order.price, shortBestPrice);

      // 推送成交数据
      order.avgPrice = tradePrice;
      order.traded = order.volume;
      order.lastPrice = tradePrice;
      order.lastVolume = order.volume;
      order.status = OrderStatus.ALLTRADED;
      this.strategy._onOrder(order);

      this.activeLimitOrders.delete(orderId);

      // 创建成交记录
      const trade: TradeData = {
        symbol: order.symbol,
        orderId: order.orderId,
        tradeId: `${this.tradeCount}`,
        direction: order.direction,
        offset: order.offset,
        price: tradePrice,
        volume: order.volume,
        time: this.datetime,
        commission: this.calcCommission(tradePrice, order.volume),
      };

      this.tradeCount++;
      this.trades.push(trade);
      this.strategy._onTrade(trade);
    }
  }

  /**
   * 停止单撮合
   */
  private crossStopOrder(): void {
    let longCrossPrice: number;
    let shortCrossPrice: number;
    let longBestPrice: number;
    let shortBestPrice: number;

    if (this.mode === BacktestingMode.BAR) {
      longCrossPrice = this.bar.high;
      shortCrossPrice = this.bar.low;
      longBestPrice = this.bar.open;
      shortBestPrice = this.bar.open;
    } else {
      longCrossPrice = this.tick.lastPrice;
      shortCrossPrice = this.tick.lastPrice;
      longBestPrice = longCrossPrice;
      shortBestPrice = shortCrossPrice;
    }

    for (const [stopOrderId, stopOrder] of this.activeStopOrders) {
      // 判断是否会触发
      const longCross = stopOrder.direction === Direction.LONG && stopOrder.price <= longCrossPrice;

      const shortCross =
        stopOrder.direction === Direction.SHORT && stopOrder.price >= shortCrossPrice;

      if (!longCross && !shortCross) {
        continue;
      }

      // 触发停止单，转为限价单
      this.activeStopOrders.delete(stopOrderId);

      const order: OrderData = {
        symbol: stopOrder.symbol,
        exchange: stopOrder.exchange,
        orderId: `${this.limitOrderCount}`,
        type: OrderType.LIMIT,
        direction: stopOrder.direction,
        offset: stopOrder.offset,
        price: stopOrder.price,
        volume: stopOrder.volume,
        avgPrice: 0,
        traded: 0,
        lastPrice: 0,
        lastVolume: 0,
        status: OrderStatus.SUBMITTING,
        time: this.datetime,
      };

      this.limitOrderCount++;
      this.limitOrders.set(order.orderId, order);
      this.activeLimitOrders.set(order.orderId, order);

      this.strategy.onStopOrder(stopOrder);
      this.strategy._onOrder(order);
    }
  }

  /**
   * 处理新的K线数据
   */
  private newBar(bar: BarData): void {
    this.bar = bar;
    this.datetime = new Date(bar.timestamp);

    this.crossLimitOrder();
    this.crossStopOrder();
    this.strategy.onBar(bar);
    // this.updateDailyClose(bar.close);
    this.snapshot(bar.close);
  }

  /**
   * 处理新的Tick数据
   */
  private newTick(tick: TickData): void {
    this.tick = tick;
    this.datetime = tick.datetime;

    this.crossLimitOrder();
    this.crossStopOrder();
    this.strategy.onTick(tick);
    // this.updateDailyClose(tick.lastPrice);
    this.snapshot(tick.lastPrice);
  }

  /**
   * 输出信息
   */
  private output(msg: string): void {
    console.log(msg);
    this.logs.push(msg);
  }

  snapshot(price: number): void {
    const date = dayjs(this.datetime).format('YYYY-MM-DD');
    const { longHolding, shortHolding } = this.strategy;
    const tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
    const holdingPnl = longHolding.getHoldingPnl(price) + shortHolding.getHoldingPnl(price);
    const pnl = tradingPnl + holdingPnl;
    const commission = longHolding.commission + shortHolding.commission;
    const turnover = longHolding.turnover + shortHolding.turnover;

    if (this.snapshots.has(date)) {
      // 更新当日收盘价
      const snapshot = this.snapshots.get(date)!;

      snapshot.price = price;
      snapshot.pnl = pnl;
      snapshot.holdingPnl = holdingPnl;
      snapshot.tradingPnl = tradingPnl;
      snapshot.commission = commission;
      snapshot.turnover = turnover;

      // 更新最小最大PNL
      if (pnl < snapshot.minPnl) {
        snapshot.minPnl = pnl;
      }

      if (pnl > snapshot.maxPnl) {
        snapshot.maxPnl = pnl;
      }
    } else {
      this.snapshots.set(date, {
        date,
        price,
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

  /**
   * 计算每日结果
   */
  private calculateDailyResult(): void {
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
    let accumPnl = 0;
    let prevSnapshot: Snapshot | null = null;
    const dates = [...this.snapshots.keys()].sort();

    for (const date of dates) {
      const snapshot = this.snapshots.get(date)!;
      const dayTrades = tradesByDate.get(date) || [];

      // 计算持仓盈亏（基于收盘价变化）
      const tradingPnl = prevSnapshot
        ? snapshot.tradingPnl - prevSnapshot.tradingPnl
        : snapshot.tradingPnl;
      const holdingPnl = prevSnapshot
        ? snapshot.holdingPnl - prevSnapshot.holdingPnl
        : snapshot.holdingPnl;

      const commission = prevSnapshot
        ? snapshot.commission - prevSnapshot.commission
        : snapshot.commission;

      const turnover = prevSnapshot ? snapshot.turnover - prevSnapshot.turnover : snapshot.turnover;

      const netPnl = tradingPnl + holdingPnl - commission;

      // 累计总盈亏
      accumPnl += netPnl;

      this.dailyResults.set(date, {
        date,
        trades: dayTrades,
        commission,
        turnover,
        tradeCount: dayTrades.length,
        tradingPnl,
        holdingPnl,
        netPnl,
        accumPnl,
      });

      prevSnapshot = snapshot;
    }
  }

  /**
   * 统计回测结果
   */
  calculateResult(output = false): BacktestingResult {
    const capital = this.balance;

    this.output('开始统计回测结果');

    // if (this.trades.length === 0) {
    //   this.output('无交易记录');
    //   throw new Error('无交易记录');
    // }

    // 计算每日盈亏
    this.calculateDailyResult();

    // 计算统计指标
    const results = [...this.dailyResults.values()];
    const totalDays = results.length;
    const profitDays = results.filter((r) => r.netPnl > 0).length;
    const lossDays = results.filter((r) => r.netPnl < 0).length;

    let totalNetPnl = 0;
    let totalCommission = 0;
    let totalTurnover = 0;
    let totalTradeCount = 0;

    results.forEach((result) => {
      totalNetPnl += result.netPnl;
      totalCommission += result.commission;
      totalTurnover += result.turnover;
      totalTradeCount += result.tradeCount;
    });

    const endBalance = capital + totalNetPnl;
    const totalReturn = totalNetPnl / capital;
    const annualReturn = (totalReturn * 365) / totalDays;
    const dailyReturn = totalReturn / totalDays;

    // 计算最大回撤
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = capital;

    for (const result of results) {
      const balance = capital + result.accumPnl;
      if (balance > peak) {
        peak = balance;
      }

      const drawdown = peak - balance;
      const drawdownPercent = drawdown / peak;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      if (drawdownPercent > maxDrawdownPercent) {
        maxDrawdownPercent = drawdownPercent;
      }
    }

    // 计算夏普比率
    const returns = results.map((r) => r.netPnl / capital);
    const returnStd = this.calculateStd(returns);
    const sharpeRatio = returnStd > 0 ? (dailyReturn / returnStd) * Math.sqrt(365) : 0;

    const backtestingResult: BacktestingResult = {
      startDate: this.startDate,
      endDate: this.endDate,
      totalDays,
      profitDays,
      lossDays,
      startBalance: capital,
      endBalance,
      maxDrawdown,
      maxDrawdownPercent,
      totalNetPnl,
      dailyNetPnl: totalNetPnl / totalDays,
      totalCommission,
      dailyCommission: totalCommission / totalDays,
      totalTurnover,
      dailyTurnover: totalTurnover / totalDays,
      totalTradeCount,
      dailyTradeCount: totalTradeCount / totalDays,
      totalReturn,
      annualReturn,
      dailyReturn,
      returnStd,
      sharpeRatio,
      returnDrawdownRatio: maxDrawdown > 0 ? totalNetPnl / maxDrawdown : 0,
    };

    if (output) {
      this.outputBacktestingResult(backtestingResult);
    }

    return backtestingResult;
  }

  /**
   * 显示回测结果
   */
  outputBacktestingResult(result: BacktestingResult): void {
    if (!result) {
      return;
    }

    this.output('='.repeat(50));
    this.output('回测结果');
    this.output('='.repeat(50));
    this.output(`开始日期：\t${result.startDate}`);
    this.output(`结束日期：\t${result.endDate}`);
    this.output(`总交易日：\t${result.totalDays}`);
    this.output(`盈利交易日：\t${result.profitDays}`);
    this.output(`亏损交易日：\t${result.lossDays}`);
    this.output('');
    this.output(`起始资金：\t${result.startBalance.toFixed(2)}`);
    this.output(`结束资金：\t${result.endBalance.toFixed(2)}`);
    this.output(`总收益率：\t${(result.totalReturn * 100).toFixed(2)}%`);
    this.output(`年化收益率：\t${(result.annualReturn * 100).toFixed(2)}%`);
    this.output(`最大回撤：\t${result.maxDrawdown.toFixed(2)}`);
    this.output(`最大回撤百分比：\t${(result.maxDrawdownPercent * 100).toFixed(2)}%`);
    this.output('');
    this.output(`总盈亏：\t${result.totalNetPnl.toFixed(2)}`);
    this.output(`总手续费：\t${result.totalCommission.toFixed(2)}`);
    this.output(`总成交金额：\t${result.totalTurnover.toFixed(2)}`);
    this.output(`总成交笔数：\t${result.totalTradeCount}`);
    this.output('');
    this.output(`日均盈亏：\t${result.dailyNetPnl.toFixed(2)}`);
    this.output(`日均手续费：\t${result.dailyCommission.toFixed(2)}`);
    this.output(`日均成交金额：\t${result.dailyTurnover.toFixed(2)}`);
    this.output(`日均成交笔数：\t${result.dailyTradeCount.toFixed(2)}`);
    this.output(`日均收益率：\t${(result.dailyReturn * 100).toFixed(2)}%`);
    this.output('');
    this.output(`收益标准差：\t${(result.returnStd * 100).toFixed(2)}%`);
    this.output(`夏普比率：\t${result.sharpeRatio.toFixed(2)}`);
    this.output(`收益回撤比：\t${result.returnDrawdownRatio.toFixed(2)}`);
  }

  /**
   * 计算标准差
   */
  private calculateStd(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  calcCommission(price: number, volume: number): number {
    return price * volume * this.commissionRate;
  }
}
