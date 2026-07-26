import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
  type DailyResultItem,
} from '@vtrader/shared';
import dayjs from 'dayjs';
import { Injectable, Scope } from '@nestjs/common';
import { Strategy, RecordData } from '../strategy/strategy';
import { StrategyService } from '../strategy/strategy.service';
import { BrokerManagerService } from '../broker-manager/broker-manager.service';
import { SendOrderParams, CancelOrderParams, StrategyEngine } from '@vtrader/shared';
import { BacktestingSetting, BacktestingResult } from '@vtrader/shared';
import { SendOrderRequest, CancelOrderRequest, HistoryRequest } from '@vtrader/shared';
import { MockBroker } from '../broker-manager/brokers/mock/mock-broker';
import { Broker } from '../broker-manager/broker';

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
  private historyData: BarData[] = [];

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
      brokerId: this.setting.brokerId,
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

    this.historyData = [];

    if (data) {
      this.historyData = data;
    } else if (dataLoader) {
      const preloadCount = this.strategy.preloadCount();
      for (let symbol of this.symbols) {
        const bars = await dataLoader(symbol, interval, preloadCount);
        this.historyData = this.historyData.concat(bars);
      }
    }

    this.historyData.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    this.writeLog(`历史数据加载完成，数据量：${this.historyData.length}`);
  }

  /**
   * 运行回测
   */
  async runBacktesting(): Promise<void> {
    this.writeLog('开始运行回测');

    await this.loadData();

    if (this.historyData.length === 0) {
      throw new Error('历史数据为空，回测结束');
    }

    // 调用策略启动
    this.strategy.start();
    this.writeLog('策略启动完成');

    this.writeLog('回放历史数据中...');

    // 遍历历史数据
    for (const data of this.historyData) {
      this.broker.refresh(data);
      await this.handleBar(data as BarData);
    }

    // 调用策略停止
    this.strategy.stop();
    this.writeLog('回放历史数据完成');

    // this.handleBacktestingEnd();
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

    // 计算最大回撤
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

    return {
      brokerId: this.setting.brokerId,
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
      dailyResults: dailyResults,
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
