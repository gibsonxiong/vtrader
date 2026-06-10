import { Injectable } from '@nestjs/common';

import { Direction, Interval, Offset, OrderStatus } from '@vtrader/shared';
import type { BarData, OrderData, TradeData } from '@vtrader/shared';
import { MarketDataService } from './market-data/market-data.service';
import { BacktestingService, type OptimizerSetting } from './backtesting/backtesting.service';
import { StrategyService } from './strategy/strategy.service';
import { BrokerManagerService } from './broker-manager/broker-manager.service';
import { BarGenerator } from './strategy/bar-generator';
import { mockBars } from './mock/bars';
// import { gridStrategyOptimizationExample } from './strategy/optimization/optimization-example';
import { test } from './optimization/index';
import type { BacktestingSetting } from '@vtrader/shared';
import config from './config';
import { readBars, writeBars } from './utils';
import { testWork } from './test-work';

// 
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
    // this.optimization();
    // this.optimization();
  }

  async testFile(): Promise<void> {
    const t0 = Date.now();
    const symbol = 'ETHUSDT:USDT';
    const interval = Interval.MINUTE_15;
    // const newBars: BarData[] = [
    //   {
    //     symbol,
    //     interval,
    //     timestamp: new Date('2019-01-01 00:00:00').valueOf(),
    //     open: 1,
    //     high: 2,
    //     low: 3,
    //     close: 4,
    //     volume: 5,
    //   }
    // ]
    const newBars = await readBars(brokerId, symbol, interval);
    // newBars.forEach((bar) => {
    //   bar.timestamp = dayjs(bar.timestamp).add(1, 'second').valueOf();
    // });
    // await writeBars(brokerId, symbol, interval, newBars);
    console.log('writeBars', Date.now() - t0);
  }
  
  async testBroker(): Promise<void> {
    const broker = await this.brokerMgrService.getBroker(brokerId);

    // const contract = broker.getContractBySymbol('BTCUSDT:USDT');

    // console.log('contract', contract);

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

    // broker.watchOrder((order: OrderData) => {
    //   console.log('order', order);

    //   if (order.status === OrderStatus.NOTTRADED) {
    //     // 取消订单
    //     broker.cancelOrder({
    //       orderId: order.orderId,
    //       symbol: order.symbol,
    //     });
    //   }
    // });

    // 发送订单
    // broker.sendOrder({
    //   orderId: '123456',
    //   symbol: 'BTCUSDT:USDT',
    //   direction: Direction.LONG,
    //   offset: Offset.OPEN,
    //   price: 83600,
    //   volume: 0.56,
    // });

    // 查询订单
    // @ts-expect-error
    const orders = await broker.restApi.queryOrders({
      symbol: 'BTCUSDT:USDT',
      limit: 10,
    });

    console.log('orders', orders);

    // // @ts-expect-error
    // const order = await broker.restApi.queryOrder({
    //   symbol: 'BTCUSDT:USDT',
    //   orderId: '123456',
    // });

    // @ts-expect-error
    const assets = await broker.restApi.queryAssets();
    console.log('assets', assets);

    // @ts-expect-error
    const positions = await broker.restApi.queryPositions();
    console.log('positions', positions);

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
      brokerId,
      startDate: '2024-11-01',
      endDate: '2025-12-01',
      symbol: 'BTCUSDT:USDT',
      interval: Interval.MINUTE_1,
      assetBalance: 100_000,
      assetName: 'USDT',
      commissionRate: 0.0005,
      strategyName: 'GridStrategy',
      strategySetting: {
        temaLength: 20,
        bbDev: 2,
        bbLength: 20,
        minVolume: 0.001,
        gridStep: 0.008,
        gridSize: 20,
        basePosCount: 8,
        useAdjustGrid: true,
      },
    };

    this.backtestingService.createBacktesting(setting);
  }

  async createStrategy(): Promise<void> {
    const strategy = await this.strategyService.createInstance({
      engine: {} as any,
      name: 'MyStrategy',
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


  testBarGenerator(): void {
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

  async getStategies(): Promise<void> {
    const stategies = await this.strategyService.getStategieConfigs();
    console.log('stategies', stategies);
  }

  async optimization(): Promise<void> {
    // test();

    // 1. 设置回测参数
    const setting: OptimizerSetting = {
      brokerId,
      startDate: '2025-10-01',
      endDate: '2025-12-01',
      symbol: 'BTCUSDT:USDT',
      interval: Interval.MINUTE_1,
      assetBalance: 100_000,
      assetName: 'USDT',
      commissionRate: 0.0005,
      strategyName: 'GridStrategy',
      // strategySetting: {
      //   temaLength: 20,
      //   bbDev: 2,
      //   bbLength: 20,
      //   minVolume: 0.001,
      //   gridStep: 0.008,
      //   gridSize: 20,
      //   basePosCount: 8,
      //   useAdjustGrid: true,
      // },
      hyperparameters: [
        {
          name: 'temaLength',
          type: 'continuous',
          range: [10, 20, 5],
        },
        {
          name: 'gridSize',
          type: 'continuous',
          range: [15, 25, 1],
        },
      ],
      maxTrials: 100,
      direction: 'maximize',
    };

    this.backtestingService.optimization(setting);
  }

  testWork(): void {
    testWork('test.txt');
    testWork('test2.txt');
  }
}
