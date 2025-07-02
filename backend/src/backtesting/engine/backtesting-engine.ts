import { Injectable } from '@nestjs/common';

import { CtaTemplate } from './cta-template';

/**
 * 回测模式枚举
 */
export enum BacktestingMode {
  BAR = 'bar', // K线回测
  TICK = 'tick', // Tick回测
}

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  ALLTRADED = 'alltraded',
  CANCELLED = 'cancelled',
  NOTTRADED = 'nottraded',
  PARTTRADED = 'parttraded',
  REJECTED = 'rejected',
  SUBMITTING = 'submitting',
}

/**
 * 订单方向枚举
 */
export enum Direction {
  LONG = 'long',
  SHORT = 'short',
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market',
  STOP = 'stop',
}

/**
 * K线数据接口
 */
export interface BarData {
  closePrice: number;
  datetime: Date;
  highPrice: number;
  interval: string;
  lowPrice: number;
  openInterest?: number;
  openPrice: number;
  symbol: string;
  volume: number;
}

/**
 * Tick数据接口
 */
export interface TickData {
  askPrice1: number;
  askPrice2: number;
  askPrice3: number;
  askPrice4: number;
  askPrice5: number;
  askVolume1: number;
  askVolume2: number;
  askVolume3: number;
  askVolume4: number;
  askVolume5: number;
  bidPrice1: number;
  bidPrice2: number;
  bidPrice3: number;
  bidPrice4: number;
  bidPrice5: number;
  bidVolume1: number;
  bidVolume2: number;
  bidVolume3: number;
  bidVolume4: number;
  bidVolume5: number;
  datetime: Date;
  highPrice: number;
  lastPrice: number;
  lastVolume: number;
  limit_down: number;
  limit_up: number;
  lowPrice: number;
  name: string;
  openPrice: number;
  preClose: number;
  symbol: string;
  volume: number;
}

export interface OrderbookData {
  asks: [string, string][];
  bids: [string, string][];
}

/**
 * 订单数据接口
 */
export interface OrderData {
  direction: Direction;
  exchange: string;
  offset: string;
  orderId: string;
  price: number;
  status: OrderStatus;
  symbol: string;
  time: Date;
  traded: number;
  type: OrderType;
  volume: number;
}

/**
 * 成交数据接口
 */
export interface TradeData {
  direction: Direction;
  exchange: string;
  offset: string;
  orderId: string;
  price: number;
  symbol: string;
  time: Date;
  tradeId: string;
  volume: number;
}

/**
 * 持仓数据接口
 */
export interface PositionData {
  direction: Direction;
  exchange: string;
  frozen: number;
  pnl: number;
  price: number;
  symbol: string;
  volume: number;
  ydVolume: number;
}

/**
 * 账户数据接口
 */
export interface AccountData {
  accountId: string;
  balance: number;
  frozen: number;
}

/**
 * 回测结果统计接口
 */
export interface BacktestingResult {
  annualReturn: number;
  dailyCommission: number;
  dailyNetPnl: number;
  dailyReturn: number;
  dailySlippage: number;
  dailyTradeCount: number;
  dailyTurnover: number;
  endBalance: number;
  endDate: Date;
  lossDays: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  profitDays: number;
  returnDrawdownRatio: number;
  returnStd: number;
  sharpeRatio: number;
  startDate: Date;
  totalCommission: number;
  totalDays: number;
  totalNetPnl: number;
  totalReturn: number;
  totalSlippage: number;
  totalTradeCount: number;
  totalTurnover: number;
}

/**
 * CTA回测引擎
 */
@Injectable()
export class BacktestingEngine {
  private activeLimitOrders: Map<string, OrderData> = new Map();
  private activeStopOrders: Map<string, OrderData> = new Map();

  private bar: BarData;
  private capital: number = 1_000_000; // 初始资金
  private commission: number;
  private dailyResults: Map<string, any> = new Map();
  private datetime: Date;
  private dts: Date[] = [];
  private endDate: Date;
  private exchange: string;

  private historyData: (BarData | TickData)[] = [];
  private interval: string;
  private limitOrderCount: number = 0;
  private limitOrders: Map<string, OrderData> = new Map();

  private logs: string[] = [];
  private mockBars: BarData[] = [];
  private mode: BacktestingMode = BacktestingMode.BAR;

  private priceTick: number = 0; // 最小价格变动
  private rate: number = 0; // 手续费率
  private size: number = 1; // 合约大小

  private slippage: number = 0; // 滑点
  private startDate: Date;

  private stopOrderCount: number = 0;
  private stopOrders: Map<string, OrderData> = new Map();
  private strategy: CtaTemplate;
  private StrategyClass: any;

  private strategySetting: any;
  private symbol: string;
  private tick: TickData;

  private tradeCount: number = 0;
  private trades: TradeData[] = [];

  constructor() {}

  /**
   * 添加策略
   */
  addStrategy<
    T extends new (
      ctaEngine: BacktestingEngine,
      strategyName: string,
      vtSymbol: string,
      setting: any,
    ) => CtaTemplate,
  >(StrategyClass: T, strategyName: string, symbol: string, setting: any): void {
    this.StrategyClass = StrategyClass;
    this.symbol = symbol;
    this.strategySetting = setting;
    this.strategy = new StrategyClass(this, strategyName, this.symbol, setting);
  }

  /**
   * 计算回测结果
   */
  calculateResult(): BacktestingResult {
    this.output('开始计算回测结果');

    if (this.trades.length === 0) {
      this.output('无交易记录');
      throw new Error('无交易记录');
    }

    // 计算每日盈亏
    this.calculateDailyResult();

    // 计算统计指标
    const results = [...this.dailyResults.values()];
    const totalDays = results.length;
    const profitDays = results.filter((r) => r.netPnl > 0).length;
    const lossDays = results.filter((r) => r.netPnl < 0).length;

    const totalNetPnl = results.reduce((sum, r) => sum + r.netPnl, 0);
    const totalCommission = results.reduce((sum, r) => sum + r.commission, 0);
    const totalSlippage = results.reduce((sum, r) => sum + r.slippage, 0);
    const totalTurnover = results.reduce((sum, r) => sum + r.turnover, 0);
    const totalTradeCount = results.reduce((sum, r) => sum + r.tradeCount, 0);

    const endBalance = this.capital + totalNetPnl;
    const totalReturn = totalNetPnl / this.capital;
    const annualReturn = (totalReturn * 365) / totalDays;
    const dailyReturn = totalReturn / totalDays;

    // 计算最大回撤
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = this.capital;

    for (const result of results) {
      const balance = this.capital + result.totalPnl;
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
    const returns = results.map((r) => r.netPnl / this.capital);
    const returnStd = this.calculateStd(returns);
    const sharpeRatio = returnStd > 0 ? (dailyReturn / returnStd) * Math.sqrt(365) : 0;

    const backtestingResult: BacktestingResult = {
      startDate: this.startDate,
      endDate: this.endDate,
      totalDays,
      profitDays,
      lossDays,
      endBalance,
      maxDrawdown,
      maxDrawdownPercent,
      totalNetPnl,
      dailyNetPnl: totalNetPnl / totalDays,
      totalCommission,
      dailyCommission: totalCommission / totalDays,
      totalSlippage,
      dailySlippage: totalSlippage / totalDays,
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

    return backtestingResult;
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
        this.strategy.onOrder(order);
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
   * 获取每日结果
   */
  getDailyResults(): any[] {
    return [...this.dailyResults.values()];
  }

  /**
   * 获取日志
   */
  getLogs(): string[] {
    return this.logs;
  }

  /**
   * 获取交易记录
   */
  getTrades(): TradeData[] {
    return this.trades;
  }

  /**
   * 载入历史数据
   */
  async loadData(): Promise<void> {
    this.output('开始加载历史数据');

    if (this.mockBars.length > 0) {
      this.historyData = this.mockBars;
    } else {
      if (this.mode === BacktestingMode.BAR) {
        // 从数据库加载K线数据
        // 这里需要根据实际的数据库结构来实现
        // const bars = await this.prismaService.barData.findMany({
        //   where: {
        //     symbol: this.symbol,
        //     interval: this.interval,
        //     datetime: {
        //       gte: this.startDate,
        //       lte: this.endDate
        //     }
        //   },
        //   orderBy: {
        //     datetime: 'asc'
        //   }
        // });
        // this.historyData = bars;
      } else {
        // 从数据库加载Tick数据
        // const ticks = await this.prismaService.tickData.findMany({
        //   where: {
        //     symbol: this.symbol,
        //     datetime: {
        //       gte: this.startDate,
        //       lte: this.endDate
        //     }
        //   },
        //   orderBy: {
        //     datetime: 'asc'
        //   }
        // });
        // this.historyData = ticks;
      }
    }

    this.output(`历史数据加载完成，数据量：${this.historyData.length}`);
  }

  /**
   * 运行回测
   */
  async runBacktesting(): Promise<void> {
    this.output('开始运行回测');

    if (!this.strategy) {
      this.output('请先添加策略');
      return;
    }

    if (this.historyData.length === 0) {
      this.output('请先加载历史数据');
      return;
    }

    // 调用策略初始化
    this.strategy.onInit();
    this.output('策略初始化完成');

    // 调用策略启动
    this.strategy.onStart();
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

    this.output('历史数据回放结束');
  }

  /**
   * 发送限价单
   */
  sendOrder(direction: Direction, offset: string, price: number, volume: number): string {
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
      traded: 0,
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
  sendStopOrder(direction: Direction, offset: string, price: number, volume: number): string {
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
      traded: 0,
      status: OrderStatus.NOTTRADED,
      time: this.datetime,
    };

    this.stopOrders.set(stopOrderId, stopOrder);
    this.activeStopOrders.set(stopOrderId, stopOrder);

    return stopOrderId;
  }

  /**
   * 设置回测模式
   */
  setBacktestingMode(mode: BacktestingMode): void {
    this.mode = mode;
  }

  /**
   * 设置初始资金
   */
  setCapital(capital: number): void {
    this.capital = capital;
  }

  setCommission(commission: number) {
    this.commission = commission;
  }

  /**
   * 设置合约信息
   */
  setContract(symbol: string, exchange: string, interval: string = '1m'): void {
    this.symbol = symbol;
    this.exchange = exchange;
    this.interval = interval;
  }

  /**
   * 设置回测结束日期
   */
  setEndDate(endDate: Date | string): void {
    this.endDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
  }

  setMockBars(mockData: BarData[]) {
    this.mockBars = mockData;
  }

  /**
   * 设置最小价格变动
   */
  setPriceTick(priceTick: number): void {
    this.priceTick = priceTick;
  }

  /**
   * 设置手续费率
   */
  setRate(rate: number): void {
    this.rate = rate;
  }

  /**
   * 设置合约大小
   */
  setSize(size: number): void {
    this.size = size;
  }

  /**
   * 设置滑点
   */
  setSlippage(slippage: number): void {
    this.slippage = slippage;
  }

  /**
   * 设置回测开始日期
   */
  setStartDate(startDate: Date | string): void {
    this.startDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
  }

  /**
   * 显示回测结果
   */
  showBacktestingResult(): void {
    const result = this.calculateResult();

    if (!result) {
      return;
    }

    this.output('='.repeat(50));
    this.output('回测结果');
    this.output('='.repeat(50));
    this.output(`开始日期：\t${result.startDate.toISOString().split('T')[0]}`);
    this.output(`结束日期：\t${result.endDate.toISOString().split('T')[0]}`);
    this.output(`总交易日：\t${result.totalDays}`);
    this.output(`盈利交易日：\t${result.profitDays}`);
    this.output(`亏损交易日：\t${result.lossDays}`);
    this.output('');
    this.output(`起始资金：\t${this.capital.toFixed(2)}`);
    this.output(`结束资金：\t${result.endBalance.toFixed(2)}`);
    this.output(`总收益率：\t${(result.totalReturn * 100).toFixed(2)}%`);
    this.output(`年化收益率：\t${(result.annualReturn * 100).toFixed(2)}%`);
    this.output(`最大回撤：\t${result.maxDrawdown.toFixed(2)}`);
    this.output(`百分比最大回撤：\t${(result.maxDrawdownPercent * 100).toFixed(2)}%`);
    this.output('');
    this.output(`总盈亏：\t${result.totalNetPnl.toFixed(2)}`);
    this.output(`总手续费：\t${result.totalCommission.toFixed(2)}`);
    this.output(`总滑点：\t${result.totalSlippage.toFixed(2)}`);
    this.output(`总成交金额：\t${result.totalTurnover.toFixed(2)}`);
    this.output(`总成交笔数：\t${result.totalTradeCount}`);
    this.output('');
    this.output(`日均盈亏：\t${result.dailyNetPnl.toFixed(2)}`);
    this.output(`日均手续费：\t${result.dailyCommission.toFixed(2)}`);
    this.output(`日均滑点：\t${result.dailySlippage.toFixed(2)}`);
    this.output(`日均成交金额：\t${result.dailyTurnover.toFixed(2)}`);
    this.output(`日均成交笔数：\t${result.dailyTradeCount.toFixed(2)}`);
    this.output('');
    this.output(`日均收益率：\t${(result.dailyReturn * 100).toFixed(2)}%`);
    this.output(`收益标准差：\t${(result.returnStd * 100).toFixed(2)}%`);
    this.output(`夏普比率：\t${result.sharpeRatio.toFixed(2)}`);
    this.output(`收益回撤比：\t${result.returnDrawdownRatio.toFixed(2)}`);
  }

  /**
   * 计算每日结果
   */
  private calculateDailyResult(): void {
    // 实现每日盈亏计算逻辑
    // 这里需要根据具体的交易记录来计算
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
   * 限价单撮合
   */
  private crossLimitOrder(): void {
    let longCrossPrice: number;
    let shortCrossPrice: number;
    let longBestPrice: number;
    let shortBestPrice: number;

    if (this.mode === BacktestingMode.BAR) {
      longCrossPrice = this.bar.lowPrice;
      shortCrossPrice = this.bar.highPrice;
      longBestPrice = this.bar.openPrice;
      shortBestPrice = this.bar.openPrice;
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
        this.strategy.onOrder(order);
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

      // 推送成交数据
      order.traded = order.volume;
      order.status = OrderStatus.ALLTRADED;
      this.strategy.onOrder(order);

      this.activeLimitOrders.delete(orderId);

      // 计算成交价格
      let tradePrice: number;
      tradePrice = longCross
        ? Math.min(order.price, longBestPrice)
        : Math.max(order.price, shortBestPrice);

      // 滑点计算
      if (order.direction === Direction.LONG) {
        tradePrice += this.slippage;
      } else {
        tradePrice -= this.slippage;
      }

      // 创建成交记录
      const trade: TradeData = {
        symbol: order.symbol,
        exchange: order.exchange,
        orderId: order.orderId,
        tradeId: `${this.tradeCount}`,
        direction: order.direction,
        offset: order.offset,
        price: tradePrice,
        volume: order.volume,
        time: this.datetime,
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
      longCrossPrice = this.bar.highPrice;
      shortCrossPrice = this.bar.lowPrice;
      longBestPrice = this.bar.openPrice;
      shortBestPrice = this.bar.openPrice;
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
        traded: 0,
        status: OrderStatus.SUBMITTING,
        time: this.datetime,
      };

      this.limitOrderCount++;
      this.limitOrders.set(order.orderId, order);
      this.activeLimitOrders.set(order.orderId, order);

      this.strategy.onStopOrder(stopOrder);
      this.strategy.onOrder(order);
    }
  }

  /**
   * 处理新的K线数据
   */
  private newBar(bar: BarData): void {
    this.bar = bar;
    this.datetime = bar.datetime;

    this.crossLimitOrder();
    this.crossStopOrder();
    this.strategy.onBar(bar);
    this.updateDailyClose(bar.closePrice);
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
    this.updateDailyClose(tick.lastPrice);
  }

  /**
   * 输出信息
   */
  private output(msg: string): void {
    console.log(msg);
    this.logs.push(msg);
  }

  /**
   * 更新每日收盘价
   */
  private updateDailyClose(price: number): void {
    const date = this.datetime.toISOString().split('T')[0];

    if (!this.dailyResults.has(date)) {
      this.dailyResults.set(date, {
        date: new Date(date),
        closePrice: price,
        preClosePrice: 0,
        trades: [],
        tradingPnl: 0,
        holdingPnl: 0,
        totalPnl: 0,
        commission: 0,
        slippage: 0,
        turnover: 0,
        tradeCount: 0,
        netPnl: 0,
      });
    }

    this.dailyResults.get(date).closePrice = price;
  }
}
