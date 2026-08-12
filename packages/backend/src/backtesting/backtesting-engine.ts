import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
} from '../types/common';
import type { DailyResultItem } from '../types/backtesting';
import dayjs from 'dayjs';
import { Injectable, Scope } from '@nestjs/common';
import { Strategy } from '../strategy/strategy';
import { StrategyService } from '../strategy/strategy.service';
import { BrokerManagerService } from '../broker/broker-manager.service';
import { SendOrderParams, CancelOrderParams, StrategyEngine, RecordData } from '../types/strategy';
import type { BacktestingSetting, BacktestingResult } from '../types/backtesting';
import { MockBroker } from '../broker/brokers/mock/mock-broker';

/**
 * 回测引擎
 */
@Injectable({
  scope: Scope.TRANSIENT
})
export class BacktestingEngine implements StrategyEngine {
  public setting: BacktestingSetting;

  private symbols: string[];

  private broker!: MockBroker;
  private strategy!: Strategy;

  // strategyDatas: Map<Strategy, StrategyData> = new Map();
  // private trades: TradeData[] = [];
  
  private datetime: Date;
  private bar: BarData;
  private historyData: AsyncIterable<BarData> = (async function* () { /* empty, replaced by loadData() */ })();

  private logs: string[] = [];

  constructor(
    private readonly strategyService: StrategyService,
    private readonly brokerManagerService: BrokerManagerService,
  ) {
  }

  /**
   * 设置回测参数
   */
  async init(setting: BacktestingSetting): Promise<void> {
    this.setting = setting;
    this.symbols =  setting.symbol.split(',');

    await this.initBroker();
    await this.initStrategy();
  }

  async initBroker(): Promise<void> {
    this.broker = await this.brokerManagerService.createMockBroker({
      brokerType: this.setting.brokerType,
      assetName: this.setting.assetName,
      assetBalance: this.setting.assetBalance,
      commissionRate: this.setting.commissionRate,
    });

    this.broker.watchOrder((order: OrderData) => {
      this.handleOrder(order);
    });

    this.broker.watchTrade((trade: TradeData) => {
      this.handleTrade(trade);
    });
  }

  /**
   * 初始化策略
   */
  async initStrategy(): Promise<void> {
    const strategy = await this.strategyService.createInstance({
      engine: this,
      symbols: this.symbols,
      name: this.setting.strategyName,
      setting: this.setting.strategySetting,
      assetBalance: this.setting.assetBalance,
      assetName: this.setting.assetName,
    });

    if (!strategy) {
      throw new Error('策略为空，回测失败');
    }

    this.strategy = strategy;

    // 调用策略初始化
    this.strategy.init();
    this.writeLog('策略初始化完成');
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.writeLog('开始加载历史数据');

    const { data, dataLoader, interval } = this.setting;

    if (data) {
      this.historyData = toAsyncIterable(data);
    } else if (dataLoader) {
      const preloadCount = this.strategy.preloadCount();
      const streams = this.symbols.map((symbol) =>
        dataLoader(symbol, interval, preloadCount),
      );

      if (streams.length === 1) {
        this.historyData = streams[0];
      } else {
        this.historyData = mergeSortedStreams(streams);
      }
    }

    this.writeLog('历史数据加载完成');
  }

  /**
   * 运行回测
   */
  async runBacktesting(): Promise<void> {
    this.writeLog('开始运行回测');

    // 调用策略启动
    this.strategy.start();
    this.writeLog('策略启动完成');

    let count = 0;
    try {
      // 流式遍历历史数据
      for await (const data of this.historyData) {
        this.broker.refresh(data);
        await this.handleBar(data as BarData);
        count++;
      }

      this.writeLog(`回放历史数据完成，共 ${count} 条`);
    } finally {
      // 调用策略停止
      this.strategy.stop();
    }
  }

  /**
   * 处理新的K线数据
   */
  private async handleBar(bar: BarData): Promise<void> {
    const barTime = dayjs(bar.timestamp);
    const startDate = this.setting.startDate;
    this.bar = bar;
    this.datetime = new Date(bar.timestamp);

    await this.strategy.handleBar(bar);

    // 如果时间小于开始时间则不记录
    if (barTime.isSame(startDate) || barTime.isAfter(startDate)) {
      this.strategy.doRecord(bar.timestamp, bar.close);
    }
  }

  // 回测回访结束，清仓
  handleBacktestingEnd() {
    // const lastBar = this.historyData[this.historyData.length - 1];

    // for (const strategy of this.strategies) {
    //   const holdings = [strategy.longHolding, strategy.shortHolding];

    //   this.cancelAllOrders(strategy);

    //   holdings.forEach((holding) => {
    //     if (holding.pos > 0) {
    //       this.sendOrder(strategy, holding.direction, Offset.CLOSE, lastBar.close, holding.pos);
    //     }
    //   });
    // }

    // const mockNextBar: BarData = {
    //   open: lastBar.close,
    //   high: lastBar.close,
    //   low: lastBar.close,
    //   close: lastBar.close,
    //   volume: 0,
    //   timestamp: dayjs(lastBar.timestamp)
    //     .add(...INTERVAL_VT2DAYJS[this.interval])
    //     .valueOf(),
    //   interval: this.interval,
    //   symbol: lastBar.symbol,
    // };
    // this.crossLimitOrder(mockNextBar);

    // this.doRecord(lastBar.close);
  }

  // 原有的同步回测方法，重命名为内部方法
  // async backtestingSync(setting: BacktestingSetting): Promise<number> {
  //   await this.setSetting(setting);

  //   await this.loadData();

  //   await this.runBacktesting();

  //   return this.calculateResult();
  // }

  handleOrder(order: OrderData): void {
    this.strategy.handleOrder(order);
  }

  handleTrade(trade: TradeData): void {
    this.strategy.handleTrade(trade);
  }

  /**
   * 发送限价单
   */
  sendOrder(params: SendOrderParams): Promise<string> {
    const { orderId, symbol, direction, offset, price, volume } = params;

    return this.broker.sendOrder({
      orderId,
      symbol,
      direction,
      offset,
      price,
      volume,
    });
  }

  /**
   * 撤销订单
   */
  cancelOrder(params: CancelOrderParams): Promise<void> {
    const { orderId, symbol } = params;

    return this.broker.cancelOrder({
      orderId,
      symbol,
    });
  }
  
  async calculateResult(): Promise<BacktestingResult> {
    this.writeLog('开始统计回测结果');

    // 计算统计指标
    const startBalance = this.setting.assetBalance;
    const dailyResults: DailyResultItem[] = [];
    let totalNetPnl = 0;

    this.strategy.calculateDailyResult();

    dailyResults.push(...this.strategy.dailyResults.values());

    dailyResults.forEach((result) => {
      totalNetPnl += result.netPnl;
    });

    // 计算最大回撤
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let balance = startBalance;
    let peak = startBalance;

    for (const result of dailyResults) {
      balance = balance + result.netPnl;
      if (balance > peak) {
        peak = balance;
      }

      const drawdown = peak - balance;
      const drawdownPercent = drawdown / peak;

      maxDrawdown = Math.max(maxDrawdown, drawdown);
      maxDrawdownPercent = Math.max(maxDrawdownPercent, drawdownPercent);
    }
    
    const endBalance = startBalance + totalNetPnl;
    const totalReturnPercent = totalNetPnl / startBalance;

    // ---- 新增指标计算 ----

    const tradingDays = dailyResults.length;

    // 年化收益率
    const annualizedReturn = tradingDays > 0
      ? Math.pow(1 + totalReturnPercent, 365 / tradingDays) - 1
      : 0;

    // Sharpe Ratio (年化)
    let sharpeRatio = 0;
    if (tradingDays > 1) {
      const dailyReturns = dailyResults.map((r) => r.netPnl / startBalance);
      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / tradingDays;
      const variance = dailyReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / tradingDays;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;
    }

    // 胜率 (按日)
    const winningDays = dailyResults.filter((r) => r.netPnl > 0).length;
    const winRate = tradingDays > 0 ? winningDays / tradingDays : 0;

    // 盈亏比 (按日)
    const grossProfit = dailyResults
      .filter((r) => r.netPnl > 0)
      .reduce((sum, r) => sum + r.netPnl, 0);
    const grossLoss = Math.abs(
      dailyResults.filter((r) => r.netPnl < 0).reduce((sum, r) => sum + r.netPnl, 0),
    );
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    // 最大连续亏损天数
    let maxConsecutiveLosses = 0;
    let currentStreak = 0;
    for (const r of dailyResults) {
      if (r.netPnl < 0) {
        currentStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      brokerType: this.setting.brokerType,
      symbol: this.setting.symbol,
      strategyName: this.setting.strategyName,
      interval: this.setting.interval,
      startDate: this.setting.startDate,
      endDate: this.setting.endDate,
      startBalance,
      endBalance,
      totalNetPnl,
      totalReturnPercent,
      maxDrawdown: -maxDrawdown,
      maxDrawdownPercent: -maxDrawdownPercent,
      sharpeRatio,
      winRate,
      profitFactor,
      annualizedReturn,
      maxConsecutiveLosses,
      dailyResults,
      trades: this.strategy.trades,
    };
  }

  /**
   * 输出信息
   */
  private writeLog(msg: string): void {
    console.log(`${msg}`);
    this.logs.push(msg);
  }
}

/**
 * 将数组包装为异步可迭代对象
 */
export async function* toAsyncIterable<T>(items: T[]): AsyncGenerator<T> {
  yield* items;
}

/**
 * 多路归并排序：将多个已按时间戳排序的流合并为单一有序流
 */
export async function* mergeSortedStreams(
  streams: AsyncGenerator<BarData>[],
): AsyncGenerator<BarData> {
  const iterators = streams.map((s) => s[Symbol.asyncIterator]());
  const buffers: {
    value: BarData;
    iterator: AsyncIterator<BarData>;
  }[] = [];

  for (const it of iterators) {
    const result = await it.next();
    if (!result.done) {
      buffers.push({ value: result.value, iterator: it });
    }
  }

  while (buffers.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < buffers.length; i++) {
      if (buffers[i].value.timestamp < buffers[minIdx].value.timestamp) {
        minIdx = i;
      }
    }

    yield buffers[minIdx].value;

    const result = await buffers[minIdx].iterator.next();
    if (result.done) {
      buffers.splice(minIdx, 1);
    } else {
      buffers[minIdx].value = result.value;
    }
  }
}
