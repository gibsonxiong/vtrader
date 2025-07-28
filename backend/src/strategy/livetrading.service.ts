import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
  TickData,
  AccountData,
  PositionData,
} from '../types/common';
import * as dayjs from 'dayjs';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Strategy } from './strategy';
import { StrategyService } from './strategy.service';
import { BrokerManagerService } from '../broker-manager/broker-manager.service';
import { Broker } from '../broker-manager/broker';
import type { OrderRequest, CancelRequest, SubscribeRequest } from '../types/broker';

/**
 * 实时交易设置接口
 */
export interface LiveTradingSetting {
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
 * 实时交易统计接口
 */
export interface LiveTradingStats {
  startTime: string;
  currentTime: string;
  totalPnl: number;
  totalCommission: number;
  totalTurnover: number;
  totalTradeCount: number;
  currentBalance: number;
  dailyPnl: number;
  positions: PositionData[];
  activeOrders: OrderData[];
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
  isRunning: boolean;
}

/**
 * 实时交易引擎
 */
@Injectable()
export class LiveTradingService implements OnModuleDestroy {
  private exchange: string;
  private symbol: string;
  private interval: Interval;
  private priceTick: number = 0;
  private commissionRate: number;
  private size: number = 1;
  private balance: number;
  private startTime: string;

  private broker: Broker | null = null;
  private isConnected: boolean = false;
  private isRunning: boolean = false;

  strategyDatas: Map<Strategy, StrategyData> = new Map();
  private limitOrderCount: number = 0;
  private tradeCount: number = 0;

  private strategies: Strategy[] = [];
  private currentBar: BarData | null = null;
  private currentTick: TickData | null = null;
  private currentAccount: AccountData | null = null;
  private currentPositions: Map<string, PositionData> = new Map();

  private logs: string[] = [];

  constructor(
    private readonly brokerManagerService: BrokerManagerService,
    private readonly strategyService: StrategyService,
  ) {}

  async onModuleDestroy() {
    await this.stop();
  }

  /**
   * 设置实时交易参数
   */
  setSetting(setting: LiveTradingSetting): void {
    this.symbol = setting.symbol;
    this.interval = setting.interval;
    this.balance = setting.balance;
    this.commissionRate = setting.commissionRate;
    this.size = setting.size;
    this.priceTick = setting.priceTick;
    this.startTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
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
    this.strategyDatas.set(strategy, {
      strategy,
      activeLimitOrders: new Map(),
      limitOrders: new Map(),
      trades: [],
      records: new Map(),
      isRunning: false,
    });
  }

  /**
   * 连接交易所
   */
  async connect(): Promise<void> {
    try {
      this.output('正在连接交易所...');
      this.broker = await this.brokerManagerService.getBroker();
      
      // 设置事件监听器
      this.setupBrokerEventListeners();
      
      this.isConnected = true;
      this.output('交易所连接成功');
    } catch (error) {
      this.output(`交易所连接失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 设置broker事件监听器
   */
  private setupBrokerEventListeners(): void {
    if (!this.broker) return;

    this.broker.on('onBar', (bar: BarData) => {
      if (bar.symbol === this.symbol && bar.interval === this.interval) {
        this.onBar(bar);
      }
    });

    this.broker.on('onTick', (tick: TickData) => {
      if (tick.symbol === this.symbol) {
        this.onTick(tick);
      }
    });

    this.broker.on('onOrder', (order: OrderData) => {
      this.onOrder(order);
    });

    this.broker.on('onTrade', (trade: TradeData) => {
      this.onTrade(trade);
    });

    this.broker.on('onAccount', (account: AccountData) => {
      this.onAccount(account);
    });

    this.broker.on('onPosition', (position: PositionData) => {
      this.onPosition(position);
    });
  }

  /**
   * 开始实时交易
   */
  async start(setting: LiveTradingSetting): Promise<void> {
    if (this.isRunning) {
      this.output('实时交易已在运行中');
      return;
    }

    this.setSetting(setting);

    // 添加策略
    for (const strategyConfig of setting.strategies) {
      await this.addStrategy(strategyConfig.strategyName, strategyConfig.strategySetting);
    }

    // 连接交易所
    if (!this.isConnected) {
      await this.connect();
    }

    // 订阅市场数据
    await this.subscribeMarketData();

    // 初始化并启动策略
    this.initializeStrategies();
    this.startStrategies();

    this.isRunning = true;
    this.output('实时交易引擎启动成功');
  }

  /**
   * 停止实时交易
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.output('正在停止实时交易引擎...');

    // 停止所有策略
    this.stopStrategies();

    // 取消所有订单
    await this.cancelAllOrders();

    // 断开broker连接
    if (this.broker) {
      this.broker.removeAllListeners();
      this.broker.stop();
      this.broker = null;
    }

    this.isConnected = false;
    this.isRunning = false;
    this.output('实时交易引擎已停止');
  }

  /**
   * 订阅市场数据
   */
  private async subscribeMarketData(): Promise<void> {
    if (!this.broker) {
      throw new Error('Broker未连接');
    }

    const subscribeRequest: SubscribeRequest = {
      symbol: this.symbol,
      exchange: this.exchange,
    };

    this.broker.subscribe(subscribeRequest);
    this.output(`已订阅 ${this.symbol} 的市场数据`);
  }

  /**
   * 初始化策略
   */
  private initializeStrategies(): void {
    for (const strategy of this.strategies) {
      strategy.init();
      const strategyData = this.strategyDatas.get(strategy);
      if (strategyData) {
        strategyData.isRunning = false;
      }
    }
    this.output('所有策略初始化完成');
  }

  /**
   * 启动策略
   */
  private startStrategies(): void {
    for (const strategy of this.strategies) {
      strategy.start();
      const strategyData = this.strategyDatas.get(strategy);
      if (strategyData) {
        strategyData.isRunning = true;
      }
    }
    this.output('所有策略启动完成');
  }

  /**
   * 停止策略
   */
  private stopStrategies(): void {
    for (const strategy of this.strategies) {
      strategy.stop();
      const strategyData = this.strategyDatas.get(strategy);
      if (strategyData) {
        strategyData.isRunning = false;
      }
    }
    this.output('所有策略已停止');
  }

  /**
   * 发送订单
   */
  sendOrder(
    strategy: Strategy,
    direction: Direction,
    offset: Offset,
    price: number,
    volume: number,
  ): string | null {
    if (!this.broker || !this.isConnected) {
      this.output('交易所未连接，无法下单');
      return null;
    }

    if (!this.isRunning) {
      this.output('交易引擎未运行，无法下单');
      return null;
    }

    // 检查资金和仓位
    if (offset === Offset.OPEN && strategy.wallet.available < price * volume) {
      this.output(`可用资金不足，无法下单`);
      return null;
    }

    if (
      offset === Offset.CLOSE &&
      ((direction === Direction.LONG && strategy.longHolding.available < volume) ||
        (direction === Direction.SHORT && strategy.shortHolding.available < volume))
    ) {
      this.output(`可用仓位不足，无法下单`);
      return null;
    }

    const strategyData = this.strategyDatas.get(strategy);
    if (!strategyData) {
      this.output('未找到该策略数据');
      return null;
    }

    const orderId = `${this.limitOrderCount}`;
    this.limitOrderCount++;

    const orderRequest: OrderRequest = {
      symbol: this.symbol,
      exchange: this.exchange,
      direction,
      offset,
      type: OrderType.LIMIT,
      price,
      volume,
      reference: orderId,
    };

    try {
      const brokerOrderId = this.broker.sendOrder(orderRequest);
      
      const order: OrderData = {
        symbol: this.symbol,
        exchange: this.exchange,
        orderId: brokerOrderId,
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

      strategyData.limitOrders.set(brokerOrderId, order);
      strategyData.activeLimitOrders.set(brokerOrderId, order);

      this.output(`订单已提交: ${brokerOrderId}`);
      return brokerOrderId;
    } catch (error) {
      this.output(`订单提交失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(strategy: Strategy, orderId: string): Promise<void> {
    if (!this.broker || !this.isConnected) {
      this.output('交易所未连接，无法取消订单');
      return;
    }

    const strategyData = this.strategyDatas.get(strategy);
    if (!strategyData) {
      this.output('未找到该策略数据');
      return;
    }

    if (strategyData.activeLimitOrders.has(orderId)) {
      const cancelRequest: CancelRequest = {
        orderId,
        symbol: this.symbol,
        exchange: this.exchange,
      };

      try {
        await this.broker.cancelOrder(cancelRequest);
        this.output(`订单取消请求已发送: ${orderId}`);
      } catch (error) {
        this.output(`订单取消失败: ${error.message}`);
      }
    }
  }

  /**
   * 取消所有订单
   */
  async cancelAllOrders(): Promise<void> {
    for (const [strategy, strategyData] of this.strategyDatas) {
      const orderIds = Array.from(strategyData.activeLimitOrders.keys());
      for (const orderId of orderIds) {
        await this.cancelOrder(strategy, orderId);
      }
    }
  }

  /**
   * 处理新的K线数据
   */
  private onBar(bar: BarData): void {
    this.currentBar = bar;
    
    for (const [strategy, strategyData] of this.strategyDatas) {
      if (strategyData.isRunning) {
        strategy.onBar(bar);
      }
    }
    
    this.doRecord(bar.close);
  }

  /**
   * 处理Tick数据
   */
  private onTick(tick: TickData): void {
    this.currentTick = tick;
    
    for (const [strategy, strategyData] of this.strategyDatas) {
      if (strategyData.isRunning) {
        strategy.onTick(tick);
      }
    }
  }

  /**
   * 处理订单更新
   */
  private onOrder(order: OrderData): void {
    // 找到对应的策略
    for (const [strategy, strategyData] of this.strategyDatas) {
      if (strategyData.limitOrders.has(order.orderId)) {
        // 更新订单状态
        strategyData.limitOrders.set(order.orderId, order);
        
        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.ALLTRADED) {
          strategyData.activeLimitOrders.delete(order.orderId);
        } else {
          strategyData.activeLimitOrders.set(order.orderId, order);
        }
        
        strategy._onOrder(order);
        break;
      }
    }
  }

  /**
   * 处理成交数据
   */
  private onTrade(trade: TradeData): void {
    // 找到对应的策略
    for (const [strategy, strategyData] of this.strategyDatas) {
      if (strategyData.limitOrders.has(trade.orderId)) {
        strategyData.trades.push(trade);
        strategy._onTrade(trade);
        break;
      }
    }
  }

  /**
   * 处理账户数据
   */
  private onAccount(account: AccountData): void {
    this.currentAccount = account;
    // 更新策略的资金信息
    for (const strategy of this.strategies) {
      strategy.wallet._total = account.balance;
      strategy.wallet._available = account.available;
    }
  }

  /**
   * 处理持仓数据
   */
  private onPosition(position: PositionData): void {
    this.currentPositions.set(position.symbol, position);
    
    // 更新策略的持仓信息
    for (const strategy of this.strategies) {
      if (position.symbol === this.symbol) {
        if (position.direction === Direction.LONG) {
          strategy.longHolding.pos = position.volume;
          strategy.longHolding.price = position.price;
        } else if (position.direction === Direction.SHORT) {
          strategy.shortHolding.pos = position.volume;
          strategy.shortHolding.price = position.price;
        }
      }
    }
  }

  /**
   * 记录数据
   */
  private doRecord(price: number): void {
    for (const [strategy, strategyData] of this.strategyDatas) {
      const date = dayjs().format('YYYY-MM-DD');
      const { longHolding, shortHolding } = strategy;
      const tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
      const holdingPnl = longHolding.getHoldingPnl(price) + shortHolding.getHoldingPnl(price);
      const pnl = tradingPnl + holdingPnl;
      const commission = longHolding.commission + shortHolding.commission;
      const turnover = longHolding.turnover + shortHolding.turnover;
      const recordData = strategyData.records.get(date);

      if (recordData) {
        recordData.price = price;
        recordData.pnl = pnl;
        recordData.holdingPnl = holdingPnl;
        recordData.tradingPnl = tradingPnl;
        recordData.commission = commission;
        recordData.turnover = turnover;

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
   * 获取实时交易统计
   */
  getStats(): LiveTradingStats {
    let totalPnl = 0;
    let totalCommission = 0;
    let totalTurnover = 0;
    let totalTradeCount = 0;
    let currentBalance = this.balance;
    let dailyPnl = 0;

    const today = dayjs().format('YYYY-MM-DD');

    for (const [strategy, strategyData] of this.strategyDatas) {
      const { longHolding, shortHolding } = strategy;
      const tradingPnl = longHolding.accumTradingPnl + shortHolding.accumTradingPnl;
      const holdingPnl = this.currentTick 
        ? longHolding.getHoldingPnl(this.currentTick.lastPrice) + shortHolding.getHoldingPnl(this.currentTick.lastPrice)
        : 0;
      
      totalPnl += tradingPnl + holdingPnl;
      totalCommission += longHolding.commission + shortHolding.commission;
      totalTurnover += longHolding.turnover + shortHolding.turnover;
      totalTradeCount += strategyData.trades.length;

      const todayRecord = strategyData.records.get(today);
      if (todayRecord) {
        dailyPnl += todayRecord.pnl;
      }
    }

    currentBalance = this.balance + totalPnl;

    return {
      startTime: this.startTime,
      currentTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      totalPnl,
      totalCommission,
      totalTurnover,
      totalTradeCount,
      currentBalance,
      dailyPnl,
      positions: Array.from(this.currentPositions.values()),
      activeOrders: Array.from(this.strategyDatas.values())
        .flatMap(data => Array.from(data.activeLimitOrders.values())),
    };
  }

  /**
   * 计算手续费
   */
  calcCommission(price: number, volume: number): number {
    return price * volume * this.commissionRate;
  }

  /**
   * 输出日志
   */
  private output(msg: string): void {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    this.logs.push(logMsg);
  }

  /**
   * 获取日志
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 获取运行状态
   */
  getStatus(): {
    isConnected: boolean;
    isRunning: boolean;
    strategiesCount: number;
    symbol: string;
  } {
    return {
      isConnected: this.isConnected,
      isRunning: this.isRunning,
      strategiesCount: this.strategies.length,
      symbol: this.symbol,
    };
  }
}