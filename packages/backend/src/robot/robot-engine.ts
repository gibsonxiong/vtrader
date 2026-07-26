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
 * 机器人引擎
 */
@Injectable({
  scope: Scope.TRANSIENT
})
export class RobotgEngine implements StrategyEngine {
  public setting: BacktestingSetting;
  private broker!: Broker;
  private symbols: string[];
  private strategy!: Strategy; 
  private datetime: Date;
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
      throw new Error('策略为空，运行机器人失败');
    }

    this.strategy = strategy;

    // 调用策略初始化
    this.strategy.init();
    this.writeLog('策略初始化完成');
  }

  /**
   * 运行回测
   */
  async start(): Promise<void> {
    this.writeLog('开始执行机器人');

    // broker监听
    this.listenBroker();

    // 调用策略启动
    this.strategy.start();
  }

  async stop(): Promise<void> {
    this.writeLog('停止机器人');

    // 调用策略停止
    this.strategy.stop();
  }

  listenBroker(): void {
    for (let symbol of this.symbols) {
      this.broker.subscribeBar({
        symbol,
        interval: this.setting.interval
      });
    }

    this.broker.watchBar((bar: BarData) => {
      this.handleBar(bar);
    });

    this.broker.watchOrder((order: OrderData) => {
      this.handleOrder(order);
    });

    this.broker.watchTrade((trade: TradeData) => {
      this.handleTrade(trade);
    });
  }

  /**
   * 处理新的K线数据
   */
  private async handleBar(bar: BarData): Promise<void> {
    const barTime = dayjs(bar.timestamp);
    const startDate = this.setting.startDate;

    await this.strategy.handleBar(bar);

    // 如果时间小于开始时间则不记录
    if (barTime.isSame(startDate) || barTime.isAfter(startDate)) {
      this.strategy.doRecord(bar.timestamp, bar.close);
    }
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
   * 输出信息
   */
  private writeLog(msg: string): void {
    console.log(`${msg}`);
    this.logs.push(msg);
  }
}
