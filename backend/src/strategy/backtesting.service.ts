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
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';

import { Strategy, BacktestingResult, DailyResultItem, RecordData } from './strategy';
import { MarketDataService } from '../market-data/market-data.service';
import { StrategyService } from './strategy.service';
import { SendOrderParams, CancelOrderParams, StrategyEngine } from '../types/strategy';
import { SendOrderRequest, CancelOrderRequest, HistoryRequest } from '../types/broker';
import { MockBroker } from '../broker-manager/brokers/mock/mock-broker';

import btcData from './history/btc';
import ethData from './history/eth';
import { INTERVAL_VT2DAYJS } from 'src/broker-manager/brokers/binance-linear/constants';
import { Wallet } from './wallet';
import { Context } from './context';
import { Broker } from '../broker-manager/broker';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  startDate: string;
  endDate: string;
  symbols: string | string[];
  interval: Interval;
  balance: number;
  commissionRate: number;
  size: number;
  priceTick: number;
  strategies: {
    strategyName: string;
    strategySetting?: Record<string, any>;
    weight?: number;
  }[];
}

// export interface StrategyData {
//   strategy: Strategy;
//   ctxs: Map<string, Context>;
//   wallet: Wallet;
//   activeLimitOrders: Map<string, OrderData>;
//   limitOrders: Map<string, OrderData>;
//   trades: TradeData[];
//   records: Map<string, RecordData>;
//   dailyResults: Map<string, DailyResultItem>;
//   backtestingResult: BacktestingResult | null;
// }


/**
 * CTA回测引擎
 */
@Injectable()
export class BacktestingService implements StrategyEngine {
  private symbols: string[];
  private interval: Interval;
  private priceTick: number = 0; // 最小价格变动
  private commissionRate: number;
  private size: number = 1; // 合约大小
  private startDate: string;
  private endDate: string;
  private balance: number;

  broker: Broker = new MockBroker();

  // strategyDatas: Map<Strategy, StrategyData> = new Map();
  // private trades: TradeData[] = [];
  
  private strategies: Strategy[] = [];
  private datetime: Date;
  private bar: BarData;
  private historyData: BarData[] = [];

  // private records: Map<string, RecordData> = new Map();
  // private dailyResults: Map<string, DailyResultItem> = new Map();

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
    this.symbols =  Array.isArray(setting.symbols) ? setting.symbols : [setting.symbols];
    this.interval = setting.interval;
    this.balance = setting.balance;
    this.commissionRate = setting.commissionRate;
    this.size = setting.size;
    this.priceTick = setting.priceTick;
  }

  /**
   * 添加策略
   */
  async addStrategy(strategyName: string, setting: any, weight: number): Promise<void> {
    const strategy = await this.strategyService.createInstance(strategyName, {
      engine: this,
      setting,
      symbols: this.symbols,
      weight
    });

    if (!strategy) {
      throw new Error('未找到该策略，策略创建失败');
    }

    this.strategies.push(strategy);

    // 重新分配资金
    const totalWeight = this.strategies.reduce((total, strategy) => {
      return total + strategy.weight;
    }, 0);
    for (let strategy of this.strategies) {
      strategy.wallet._total = this.balance * strategy.weight / totalWeight;
    }
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.output('开始加载历史数据');

    this.historyData = [];

    let maxPreloadCount = 0;

    for (const strategy of this.strategies) {
      const preloadCount = strategy.preloadCount();
      if (preloadCount > maxPreloadCount) {
        maxPreloadCount = preloadCount;
      }
    }


    // 从数据库加载K线数据
    for (let symbol of this.symbols) {
      const bars = await this.marketDataService.getBars({
        symbol: symbol,
        interval: this.interval,
        start: this.startDate,
        end: this.endDate,
        preload: maxPreloadCount
      });

      // let bars: BarData[] = [];

      // if (symbol === 'BTCUSDT:USDT') {
      //   bars = btcData as BarData[];
      // } else if (symbol === 'ETHUSDT:USDT') {
      //   bars = ethData as BarData[];
      // }
  
      this.historyData.push(...bars);
    }

    this.historyData.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    this.output(`历史数据加载完成，数据量：${this.historyData.length}`);
  }

  /**
   * 运行回测
   */
  private runBacktesting(): void {
    this.output('开始运行回测');

    if (this.strategies.length === 0) {
      this.output('请先添加策略');
      return;
    }

    if (this.historyData.length === 0) {
      this.output('请先加载历史数据');
      return;
    }

    // 调用策略初始化
    for (const strategy of this.strategies) {
      strategy.init();
    }
    this.output('所有策略初始化完成');

    // 调用策略启动
    for (const strategy of this.strategies) {
      strategy.start();
    }
    this.output('所有策略启动完成');

    this.output('开始回放历史数据');

    // 遍历历史数据
    for (const data of this.historyData) {
      this.newBar(data as BarData);
    }

    // 调用策略停止
    for (const strategy of this.strategies) {
      strategy.stop();
    }
    this.output('回放历史数据结束');

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

  async backtesting(setting: BacktestingSetting): Promise<void> {
    await this.initBroker();

    this.setSetting(setting);

    const balance = setting.balance;
    let totalWeight = 0;
    for (const strategy of setting.strategies) {
      const weight = strategy.weight || 1;
      totalWeight += weight;
      await this.addStrategy(strategy.strategyName, strategy.strategySetting, weight);
    }

    await this.loadData();

    this.runBacktesting();
    this.calculateResult(true);
  }

  async initBroker(): Promise<void> {
    this.broker = new MockBroker();
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

  handleOrder(order: OrderData): void {
    for (const strategy of this.strategies) {
      strategy.handleOrder(order);
    }
  }

  handleTrade(trade: TradeData): void {
    for (const strategy of this.strategies) {
      strategy.handleTrade(trade);
    }
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
  private newBar(bar: BarData): void {
    this.bar = bar;
    this.datetime = new Date(bar.timestamp);

    this.broker.refresh(bar);

    for (const strategy of this.strategies) {
      strategy.handleBar(bar);
      strategy.doRecord(bar.timestamp, bar.close);
    }
  }

  /**
   * 计算每日结果
   */
  private calculateDailyResult(): void {
    for (const strategy of this.strategies) {
      // 按日期分组交易记录
      const tradesByDate = new Map<string, TradeData[]>();

      for (const trade of strategy.trades) {
        const date = dayjs(trade.time).format('YYYY-MM-DD');
        if (!tradesByDate.has(date)) {
          tradesByDate.set(date, []);
        }
        tradesByDate.get(date)!.push(trade);
      }

      // 计算累计收益
      let accumPnl = 0;
      let prevRecord: RecordData | null = null;
      const dates = [...strategy.records.keys()].sort();

      for (const date of dates) {
        const record = strategy.records.get(date)!;
        const dayTrades = tradesByDate.get(date) || [];

        // 计算持仓盈亏（基于收盘价变化）
        const tradingPnl = prevRecord
          ? record.tradingPnl - prevRecord.tradingPnl
          : record.tradingPnl;
        const holdingPnl = prevRecord
          ? record.holdingPnl - prevRecord.holdingPnl
          : record.holdingPnl;

        const commission = prevRecord
          ? record.commission - prevRecord.commission
          : record.commission;

        const turnover = prevRecord ? record.turnover - prevRecord.turnover : record.turnover;

        const netPnl = tradingPnl + holdingPnl - commission;

        // 累计总盈亏
        accumPnl += netPnl;

        strategy.dailyResults.set(date, {
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

        prevRecord = record;
      }
    }
  }

  /**
   * 统计回测结果
   */
  calculateResult(output = false): void {
    const capital = this.balance;

    this.output('开始统计回测结果');

    // 计算每日盈亏
    this.calculateDailyResult();

    for (const strategy of this.strategies) {
      // 计算统计指标
      const results = [...strategy.dailyResults.values()];
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

      strategy.backtestingResult = backtestingResult;

      if (output) {
        this.outputBacktestingResult(strategy, backtestingResult);
      }
    }
  }

  /**
   * 显示回测结果
   */
  outputBacktestingResult(strategy: Strategy, result: BacktestingResult): void {
    if (!result) {
      return;
    }

    this.output('='.repeat(50));
    this.output(`[${strategy.constructor.name}]回测结果`);
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

  /**
   * 输出信息
   */
  private output(msg: string): void {
    console.log(`${msg}`);
    this.logs.push(msg);
  }
}
