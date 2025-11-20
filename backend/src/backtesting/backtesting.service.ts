import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
} from '@vtrader/shared';
import dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { Strategy, DailyResultItem, RecordData } from '../strategy/strategy';
import { MarketDataService } from '../market-data/market-data.service';
import { StrategyService } from '../strategy/strategy.service';
import { SendOrderParams, CancelOrderParams, StrategyEngine } from '@vtrader/shared';
import { BacktestingSetting, BacktestingResult } from '@vtrader/shared';
import { SendOrderRequest, CancelOrderRequest, HistoryRequest } from '@vtrader/shared';
import { MockBroker } from '../broker-manager/brokers/mock/mock-broker';

import { Broker } from '../broker-manager/broker';
import { PrismaService } from '../prisma.service';
import type { Backtesting, Prisma } from '@vtrader/shared/prismaClient';

/**
 * CTA回测引擎
 */
@Injectable()
export class BacktestingService implements StrategyEngine {
  private symbols: string[];
  private interval: Interval;
  private strategyName: string;
  private startDate: string;
  private endDate: string;
  private balance: number;
  private assetName: string;

  private broker!: Broker;
  private strategy!: Strategy;

  // strategyDatas: Map<Strategy, StrategyData> = new Map();
  // private trades: TradeData[] = [];
  
  private datetime: Date;
  private bar: BarData;
  private historyData: BarData[] = [];

  private logs: string[] = [];

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly strategyService: StrategyService,
    private readonly prisma: PrismaService,
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
  ) {}

  /**
   * 设置回测参数
   */
  async setSetting(setting: BacktestingSetting): Promise<void> {
    const { strategyName, strategySetting } = setting.strategy;

    this.startDate = setting.startDate;
    this.endDate = setting.endDate;
    this.strategyName = setting.strategy.strategyName;
    this.symbols =  Array.isArray(setting.symbols) ? setting.symbols : [setting.symbols];
    this.interval = setting.interval;
    this.balance = setting.balance;
    this.assetName = setting.assetName || 'USDT';

    await this.initBroker(setting);
    await this.initStrategy(strategyName, strategySetting);
  }

  async initBroker(setting: BacktestingSetting): Promise<void> {
    this.broker = new MockBroker({
      commissionRate: setting.commissionRate,
      assetBalance: setting.balance,
    });
    // await this.broker.connect({
    //   apiKey: string;
    //   apiSecret: string;
    //   klineStream: boolean;
    //   proxyHost?: string;
    //   proxyPort?: number;
    //   server: 'REAL' | 'TESTNET';
    // });

    this.broker.watchOrder((order: OrderData) => {
      this.handleOrder(order);
    });

    this.broker.watchTrade((trade: TradeData) => {
      this.handleTrade(trade);
    });
  }

  /**
   * 添加策略
   */
  async initStrategy(strategyName: string, setting: Record<string, any> | undefined): Promise<void> {
    const strategy = await this.strategyService.createInstance(strategyName, {
      engine: this,
      symbols: this.symbols,
      setting,
      assetBalance: this.balance,
      assetName: this.assetName,
    });

    if (!strategy) {
      throw new Error('未找到该策略，策略创建失败');
    }

    this.strategy = strategy;
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.writeLog('开始加载历史数据');

    this.historyData = [];

    const preloadCount = this.strategy.preloadCount();

    // 从数据库加载K线数据
    for (let symbol of this.symbols) {
      const bars = await this.marketDataService.getBarsFromDb({
        brokerId: '1',
        symbol: symbol,
        interval: this.interval,
        startDate: this.startDate,
        endDate: this.endDate,
        preload: preloadCount,
      });

      // let bars: BarData[] = [];

      // if (symbol === 'BTCUSDT:USDT') {
      //   bars = btcData as BarData[];
      // } else if (symbol === 'ETHUSDT:USDT') {
      //   bars = ethData as BarData[];
      // }

      this.historyData = this.historyData.concat(bars);
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

    if (this.strategy === undefined) {
      this.writeLog('请先添加策略');
      return;
    }

    if (this.historyData.length === 0) {
      this.writeLog('请先加载历史数据');
      return;
    }

    // 调用策略初始化
    this.strategy.init();
    this.writeLog('策略初始化完成');

    // 调用策略启动
    this.strategy.start();
    this.writeLog('策略启动完成');

    this.writeLog('开始回放历史数据');

    // 遍历历史数据
    for (const data of this.historyData) {
      this.broker.refresh(data);
      await this.newBar(data as BarData);
    }

    // 调用策略停止
    this.strategy.stop();
    this.writeLog('回放历史数据结束');

    // this.handleBacktestingEnd();
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
  async backtestingSync(setting: BacktestingSetting): Promise<number> {
    await this.setSetting(setting);

    await this.loadData();

    await this.runBacktesting();

    return this.calculateResult();
  }

  // 新的异步回测方法，使用队列
  async backtesting(setting: BacktestingSetting): Promise<{ jobId: string; message: string }> {
    const job = await this.backtestingQueue.add('run-backtest', setting, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return {
      jobId: job.id.toString(),
      message: '回测任务已提交，正在后台处理...',
    };
  }

  // 获取任务状态
  async getJobStatus(jobId: string) {
    const job = await this.backtestingQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found', message: '任务不存在' };
    }

    const state = await job.getState();
    const progress = job.progress();
    
    return {
      status: state,
      progress,
      data: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

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

  /**
   * 处理新的K线数据
   */
  private async newBar(bar: BarData): Promise<void> {
    this.bar = bar;
    this.datetime = new Date(bar.timestamp);

    await this.strategy.handleBar(bar);

    // 如果时间小于开始时间则不记录
    if (dayjs(bar.timestamp).isBefore(this.startDate)) {
      return;
    }
    this.strategy.doRecord(bar.timestamp, bar.close);
    
  }
  
  /**
   * 统计回测结果
   */
  async calculateResult(): Promise<number> {
    this.writeLog('开始统计回测结果');

    // 计算统计指标
    const startBalance = this.balance;
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
    let peak = startBalance;

    // 计算最大回撤
    for (const result of dailyResults) {
      const balance = startBalance + result.netPnl;
      if (balance > peak) {
        peak = balance;
      }

      const drawdown = balance - peak;
      const drawdownPercent = drawdown / peak;

      maxDrawdown = Math.min(maxDrawdown, drawdown);
      maxDrawdownPercent = Math.min(maxDrawdownPercent, drawdownPercent);

      // if (drawdown > maxDrawdown) {
      //   maxDrawdown = drawdown;
      // }

      // if (drawdownPercent > maxDrawdownPercent) {
      //   maxDrawdownPercent = drawdownPercent;
      // }
    }


    const endBalance = startBalance + totalNetPnl;
    const totalReturnPercent = totalNetPnl / startBalance;

    // const backtestingResult: BacktestingResult = {
    //   startDate: this.startDate,
    //   endDate: this.endDate,
    //   startBalance,
    //   endBalance,
    //   maxDrawdown,
    //   maxDrawdownPercent,
    //   totalNetPnl,
    //   totalReturnPercent,
    // };

    const backtesting = await this.prisma.backtesting.create({
      data: {
        symbol: this.symbols.join(','),
        strategyName: this.strategyName,
        interval: this.interval,
        startDate: this.startDate,
        endDate: this.endDate,
        startBalance,
        endBalance,
        maxDrawdown,
        maxDrawdownPercent,
        totalNetPnl,
        totalReturnPercent,
        dailyResults: dailyResults as object,
        trades: this.strategy.trades as any[],
      }
    });

    return backtesting.id;
  }

  /**
   * 显示回测结果
   */
  // outputBacktestingResult(strategy: Strategy, result: BacktestingResult): void {
  //   if (!result) {
  //     return;
  //   }

  //   this.output('='.repeat(50));
  //   this.output(`[${strategy.constructor.name}]回测结果`);
  //   this.output('='.repeat(50));
  //   this.output(`开始日期：\t${result.startDate}`);
  //   this.output(`结束日期：\t${result.endDate}`);
  //   this.output(`总交易日：\t${result.totalDays}`);
  //   this.output(`盈利交易日：\t${result.profitDays}`);
  //   this.output(`亏损交易日：\t${result.lossDays}`);
  //   this.output('');
  //   this.output(`起始资金：\t${result.startBalance.toFixed(2)}`);
  //   this.output(`结束资金：\t${result.endBalance.toFixed(2)}`);
  //   this.output(`总收益率：\t${(result.totalReturn * 100).toFixed(2)}%`);
  //   this.output(`年化收益率：\t${(result.annualReturn * 100).toFixed(2)}%`);
  //   this.output(`最大回撤：\t${result.maxDrawdown.toFixed(2)}`);
  //   this.output(`最大回撤百分比：\t${(result.maxDrawdownPercent * 100).toFixed(2)}%`);
  //   this.output('');
  //   this.output(`总盈亏：\t${result.totalNetPnl.toFixed(2)}`);
  //   this.output(`总手续费：\t${result.totalCommission.toFixed(2)}`);
  //   this.output(`总成交金额：\t${result.totalTurnover.toFixed(2)}`);
  //   this.output(`总成交笔数：\t${result.totalTradeCount}`);
  //   this.output('');
  //   this.output(`收益标准差：\t${(result.returnStd * 100).toFixed(2)}%`);
  //   this.output(`夏普比率：\t${result.sharpeRatio.toFixed(2)}`);
  //   this.output(`收益回撤比：\t${result.returnDrawdownRatio.toFixed(2)}`);
  // }

  getBacktestingResult(id: number): Promise<Backtesting | null> {
    return this.prisma.backtesting.findUnique({
      where: {
        id,
      }
    });
  }

  async getBacktestingResults(params: Prisma.BacktestingFindManyArgs): Promise<{ data: Backtesting[], total: number }> {
    const { where, skip, take, orderBy } = params;

    console.log(where)
    // 过滤掉空字符串的where查询
    if (where) {
      Object.keys(where).forEach(key => {
        if (where[key] === '') {
          delete where[key];
        }
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.backtesting.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || {
          id: 'desc'
        }
      }),
      this.prisma.backtesting.count({
        where
      })
    ]);
    return { data, total };
  }

  /**
   * 删除回测历史
   */
  async removeBacktesting(id: number): Promise<void> {
    await this.prisma.backtesting.delete({
      where: {
        id,
      }
    });
  }

  /**
   * 输出信息
   */
  private writeLog(msg: string): void {
    console.log(`${msg}`);
    this.logs.push(msg);
  }
}
