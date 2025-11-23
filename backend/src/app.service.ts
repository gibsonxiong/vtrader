import { Injectable } from '@nestjs/common';

import { Direction, Interval, Offset, OrderStatus } from '@vtrader/shared';
import type { BarData, OrderData, TradeData } from '@vtrader/shared';
import { MarketDataService } from './market-data/market-data.service';
import { BacktestingService } from './backtesting/backtesting.service';
import { StrategyService } from './strategy/strategy.service';
import { BrokerManagerService } from './broker-manager/broker-manager.service';
import { BarGenerator } from './strategy/bar-generator';
import { mockBars } from './mock/bars';
// import { gridStrategyOptimizationExample } from './strategy/optimization/optimization-example';
import { test } from './optimization/index';
import type { BacktestingSetting } from '@vtrader/shared';
import config from './config';

// test();
// console.log(bollingerbands({period : 3, values : [2,3,4,5,6,7,8,9,10,11], stdDev : 2}));

const brokerId = config.brokers[0].id;

@Injectable()
export class AppService {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly backtestingService: BacktestingService,
    private readonly brokerMgrService: BrokerManagerService,
    private readonly strategyService: StrategyService,
  ) {
    this.testBroker();
  }

  // 获取K线
  async getBars(): Promise<void> {
    const bars = await this.marketDataService.getBarsFromDb({
      brokerId,
      startDate: '2022-01-01',
      endDate: '2025-01-02',
      interval: Interval.MINUTE_15,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(bars);
  }

  // 下载K线
  async downlaod(): Promise<void> {
    const count = await this.marketDataService.downloadBars({
      brokerId,
      startDate: '2025-07-01',
      // endDate: '2025-05-02',
      interval: Interval.MINUTE_1,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(count);
  }

  // 回测
  async backtesting(): Promise<void> {
    // 1. 设置回测参数
    const setting: BacktestingSetting = {
      startDate: '2025-07-08',
      endDate: '2025-07-23',
      symbols: ['BTCUSDT:USDT', 'ETHUSDT:USDT'],
      interval: Interval.MINUTE_1,
      balance: 100_000,
      commissionRate: 0.0005,
      strategy: {
        strategyName: 'GridStrategy',
        strategySetting: {
          // rsiWindow: 20,
        },
      },
    };

    this.backtestingService.backtesting(setting);
  }

  async createStrategy(): Promise<void> {
    const strategy = await this.strategyService.createInstance('MyStrategy', {
      engine: {} as any,
      symbols: ['BTCUSDT:USDT'],
      assetBalance: 1000,
      assetName: 'USDT',
      setting: {
        fastWindow: 10,
        slowWindow: 20,
        fixedSize: 1,
      },
    });

    console.log(strategy);
  }

  async testBroker(): Promise<void> {
    const broker = await this.brokerMgrService.getBroker(brokerId);

    const contract = broker.getContractBySymbol('BTCUSDT:USDT');

    console.log('contract', contract);

    // broker.subscribeBar({
    //   symbol: 'BTCUSDT:USDT',
    //   interval: Interval.MINUTE_5,
    // });

    // broker.watchBar((bar: BarData) => {
    //   // console.log(bar);

    //   broker.unsubscribeBar({
    //     symbol: 'BTCUSDT:USDT',
    //     interval: Interval.MINUTE_5,
    //   });
    // });

    // broker.watchTrade((trade: TradeData) => {
    //   console.log('trade', trade);
    // });

    broker.watchOrder((order: OrderData) => {
      console.log('order', order);

      if (order.status === OrderStatus.NOTTRADED) {
        // 取消订单
        broker.cancelOrder({
          orderId: order.orderId,
          symbol: order.symbol,
        });
      }
    });

    // 发送订单
    broker.sendOrder({
      orderId: '12345',
      symbol: 'BTCUSDT:USDT',
      direction: Direction.LONG,
      offset: Offset.OPEN,
      price: 85000,
      volume: 0.01,
    });
  }

  test6(): void {
    const bg = new BarGenerator({
      interval: Interval.DAILY_1,
      callback: (bar: BarData) => {
        console.log(bar);
      },
    });

    mockBars.forEach((bar) => {
      bg.update(bar);
    });
  }

  async test7(): Promise<void> {
    const stategies = await this.strategyService.getStategies();
    console.log('stategies', stategies);
  }

  async optimization(): Promise<void> {
    // await gridStrategyOptimizationExample();
  }
}
