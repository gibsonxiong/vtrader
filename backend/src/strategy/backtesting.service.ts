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

import { Strategy } from './strategy';
import { MarketDataService } from '../market-data/market-data.service';
import { StrategyService } from './strategy.service';

import mockData from './history';
import { INTERVAL_VT2DAYJS } from 'src/broker-manager/brokers/binance-linear/constants';

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
  strategies: {
    strategyName: string;
    strategySetting?: Record<string, any>;
  }[];
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

export interface RecordData {
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

export interface StrategyData {
  strategy: Strategy;
  activeLimitOrders: Map<string, OrderData>;
  limitOrders: Map<string, OrderData>;
  trades: TradeData[];
  records: Map<string, RecordData>;
  dailyResults: Map<string, DailyResultItem>;
  backtestingResult: BacktestingResult | null;
}

/**
 * CTA回测引擎
 */
@Injectable()
export class BacktestingService {
  private exchange: string;
  private symbol: string;
  private interval: Interval;
  private priceTick: number = 0; // 最小价格变动
  private commissionRate: number;
  private size: number = 1; // 合约大小
  private startDate: string;
  private endDate: string;
  private balance: number;

  strategyDatas: Map<Strategy, StrategyData> = new Map();
  // private activeLimitOrders: Map<string, OrderData> = new Map();
  // private limitOrders: Map<string, OrderData> = new Map();
  // private trades: TradeData[] = [];

  private limitOrderCount: number = 0;
  private tradeCount: number = 0;

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
    this.symbol = setting.symbol;
    this.interval = setting.interval;
    this.balance = setting.balance;
    this.commissionRate = setting.commissionRate;
    this.size = setting.size;
    this.priceTick = setting.priceTick;
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

    this.strategies.push(strategy);
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.output('开始加载历史数据');

    // 从数据库加载K线数据
    const bars = await this.marketDataService.getBars({
      symbol: this.symbol,
      interval: this.interval,
      start: this.startDate,
      end: this.endDate,
    });
    this.historyData = bars;

    this.historyData = mockData as BarData[];

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

    this.handleBacktestingEnd();
  }

  // 回测回访结束，清仓
  handleBacktestingEnd() {
    const lastBar = this.historyData[this.historyData.length - 1];

    for (const strategy of this.strategies) {
      const holdings = [strategy.longHolding, strategy.shortHolding];

      this.cancelAllOrders(strategy);

      holdings.forEach((holding) => {
        if (holding.pos > 0) {
          this.sendOrder(strategy, holding.direction, Offset.CLOSE, lastBar.close, holding.pos);
        }
      });
    }

    const mockNextBar: BarData = {
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: lastBar.close,
      volume: 0,
      timestamp: dayjs(lastBar.timestamp)
        .add(...INTERVAL_VT2DAYJS[this.interval])
        .valueOf(),
      interval: this.interval,
      symbol: this.symbol,
    };
    this.crossLimitOrder(mockNextBar);

    this.doRecord(lastBar.close);
  }

  async backtesting(setting: BacktestingSetting): Promise<void> {
    this.setSetting(setting);

    for (const strategy of setting.strategies) {
      await this.addStrategy(strategy.strategyName, strategy.strategySetting);
    }

    this.strategies.forEach((strategy) => {
      this.strategyDatas.set(strategy, {
        strategy,
        activeLimitOrders: new Map(),
        limitOrders: new Map(),
        trades: [],
        records: new Map(),
        dailyResults: new Map(),
        backtestingResult: null,
      });
    });

    await this.loadData();

    this.runBacktesting();
    this.calculateResult(true);
  }

  /**
   * 发送限价单
   */
  sendOrder(
    strategy: Strategy,
    direction: Direction,
    offset: Offset,
    price: number,
    volume: number,
  ): string | null {
    if (offset === Offset.OPEN && strategy.wallet.available < price * volume) {
      this.output(`可用资金不足，无法下单`);
      return null;
    }

    if (
      offset === Offset.CLOSE &&
      ((direction === Direction.LONG && strategy.longHolding.available < volume) ||
        (direction === Direction.SHORT && strategy.shortHolding.available < volume))
    ) {
      this.output(`[下单_开${direction === Direction.LONG ? '多' : '空'}]可用仓位不足，无法下单`);
      return null;
    }

    let strategyData = this.strategyDatas.get(strategy);

    if (!strategyData) {
      console.error('为找到该策略数据');
      return null;
    }

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
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: this.datetime,
      tradeCommission: 0,
    };

    strategyData.limitOrders.set(orderId, order);
    strategyData.activeLimitOrders.set(orderId, order);

    return orderId;
  }

  /**
   * 撤销订单
   */
  cancelOrder(strategy: Strategy, orderId: string): void {
    let strategyData = this.strategyDatas.get(strategy);
    if (!strategyData) {
      console.error('为找到该策略数据');
      return;
    }

    if (strategyData.activeLimitOrders.has(orderId)) {
      const order = strategyData.activeLimitOrders.get(orderId);
      if (order) {
        order.status = OrderStatus.CANCELLED;
        strategyData.activeLimitOrders.delete(orderId);
        strategy._onOrder(order);
      }
    }
  }

  cancelAllOrders(strategy: Strategy): void {
    let strategyData = this.strategyDatas.get(strategy);
    if (!strategyData) {
      console.error('为找到该策略数据');
      return;
    }

    strategyData.activeLimitOrders.forEach((order) => {
      this.cancelOrder(strategy, order.orderId);
    });
  }

  /**
   * 处理新的K线数据
   */
  private newBar(bar: BarData): void {
    this.bar = bar;
    this.datetime = new Date(bar.timestamp);

    this.crossLimitOrder(bar);

    for (const [strategy, strategyData] of this.strategyDatas) {
      strategy.onBar(bar);
    }
    this.doRecord(bar.close);
  }

  /**
   * 限价单撮合
   */
  private crossLimitOrder(bar: BarData): void {
    let longCrossPrice: number;
    let shortCrossPrice: number;
    let longBestPrice: number;
    let shortBestPrice: number;

    longCrossPrice = bar.low;
    shortCrossPrice = bar.high;
    longBestPrice = bar.open;
    shortBestPrice = bar.open;

    for (const [strategy, strategyData] of this.strategyDatas) {
      const activeLimitOrders = strategyData.activeLimitOrders;

      for (const [orderId, order] of activeLimitOrders) {
        // 推送委托进入未成交队列的更新状态
        if (order.status === OrderStatus.SUBMITTING) {
          order.status = OrderStatus.NOTTRADED;
          strategy._onOrder(order);
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
        order.tradePrice = tradePrice;
        order.tradeVolume = order.volume;
        order.status = OrderStatus.ALLTRADED;
        order.tradeCommission = this.calcCommission(tradePrice, order.volume);
        strategy._onOrder(order);

        strategyData.activeLimitOrders.delete(orderId);

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
        strategyData.trades.push(trade);
        strategy._onTrade(trade);
      }
    }
  }

  doRecord(price: number): void {
    for (let [strategy, strategyData] of this.strategyDatas) {
      const date = dayjs(this.datetime).format('YYYY-MM-DD');
      const { longHolding, shortHolding } = strategyData.strategy;
      const tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
      const holdingPnl = longHolding.getHoldingPnl(price) + shortHolding.getHoldingPnl(price);
      const pnl = tradingPnl + holdingPnl;
      const commission = longHolding.commission + shortHolding.commission;
      const turnover = longHolding.turnover + shortHolding.turnover;
      const recordData = strategyData.records.get(date);

      if (recordData) {
        // 更新当日收盘价
        recordData.price = price;
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
        strategyData.records.set(date, {
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
  }

  /**
   * 计算每日结果
   */
  private calculateDailyResult(): void {
    for (const [strategy, strategyData] of this.strategyDatas) {
      // 按日期分组交易记录
      const tradesByDate = new Map<string, TradeData[]>();

      for (const trade of strategyData.trades) {
        const date = dayjs(trade.time).format('YYYY-MM-DD');
        if (!tradesByDate.has(date)) {
          tradesByDate.set(date, []);
        }
        tradesByDate.get(date)!.push(trade);
      }

      // 计算累计收益
      let accumPnl = 0;
      let prevRecord: RecordData | null = null;
      const dates = [...strategyData.records.keys()].sort();

      for (const date of dates) {
        const record = strategyData.records.get(date)!;
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

        strategyData.dailyResults.set(date, {
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

    for (const [strategy, strategyData] of this.strategyDatas) {
      // 计算统计指标
      const results = [...strategyData.dailyResults.values()];
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

      strategyData.backtestingResult = backtestingResult;

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

  calcCommission(price: number, volume: number): number {
    return price * volume * this.commissionRate;
  }

  /**
   * 输出信息
   */
  private output(msg: string): void {
    console.log(`${msg}`);
    this.logs.push(msg);
  }
}
