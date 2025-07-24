import { Injectable } from '@nestjs/common';

import MyStrategy from './strategy/strategies/my-strategy';
import { Exchange, Interval } from './types/common';
import type { BarData, OrderData, TradeData } from './types/common';
import { MarketDataService } from './market-data/market-data.service';
import {
  BacktestingMode,
  BacktestingService,
  BacktestingSetting,
} from './strategy/backtesting.service';
import { StrategyService } from './strategy/strategy.service';
import loadStrategyClasses from './load_strategy';
import { BrokerManagerService } from './broker-manager/broker-manager.service';
import { BarGenerator } from './strategy/bar-generator';
import { mockBars } from './mock/bars';


// console.log(bollingerbands({period : 3, values : [2,3,4,5,6,7,8,9,10,11], stdDev : 2}));

@Injectable()
export class AppService {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly backtestingService: BacktestingService,
    private readonly brokerMgrService: BrokerManagerService,
    private readonly strategyService: StrategyService,
  ) {
    // this.test2();
    // this.test3();
    this.test3();
  }

  getHello(): string {
    return 'Hello World!';
  }

  // 获取K线
  async test1(): Promise<void> {
    const bars = await this.marketDataService.getBars({
      start: '2022-01-01',
      end: '2025-01-02',
      interval: Interval.MINUTE_15,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(bars);
  }

  // 下载K线
  async test2(): Promise<void> {
    const count = await this.marketDataService.downloadBars({
      start: '2025-07-01',
      // end: '2025-05-02',
      interval: Interval.MINUTE_1,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(count);
  }

  // 回测
  async test3(): Promise<void> {
    // 1. 设置回测参数
    const setting: BacktestingSetting = {
      startDate: '2025-07-08',
      endDate: '2025-07-23',
      symbol: 'BTCUSDT:USDT',
      interval: Interval.MINUTE_1,
      balance: 20_000,
      commissionRate: 0.0005,
      size: 1,
      priceTick: 0.01,
      mode: BacktestingMode.BAR,
      strategy: {
        strategyName: 'MyStrategy',
        strategySetting: {
          rsiWindow: 20,
        }
      }
    };

    this.backtestingService.backtesting(setting);
  }

  async test4(): Promise<void> {
    const strategy = await this.strategyService.createInstance('MyStrategy', {
      engine: {} as any,
      balance: 100_000,
      symbol: 'BTCUSDT:USDT',
      setting: {
        fastWindow: 10,
        slowWindow: 20,
        fixedSize: 1,
      },
    });

    console.log(strategy);
  }

  async test5(): Promise<void> {
    const broker = await this.brokerMgrService.getBroker();

    const contract = broker.getContractBySymbol('BTCUSDT:USDT');

    console.log('contract', contract);

    broker.subscribe({
      exchange: Exchange.BINANCE,
      symbol: 'BTCUSDT:USDT',
    });

    broker.on('bar', (bar: BarData) => {
      console.log(bar);
    });

    broker.on('trade', (trade: TradeData) => {
      console.log('trade', trade);
    });

    broker.on('order', (order: OrderData) => {
      console.log('order', order);
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
    console.log('stategies', stategies)
  }
}
