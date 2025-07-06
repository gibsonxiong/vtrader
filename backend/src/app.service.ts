import { Injectable } from '@nestjs/common';

import { DoubleMaStrategy } from './engine/strategies/double-ma-strategy';
import { Interval } from './engine/types/common';
import { MarketDataService } from './market-data/market-data.service';
import {
  BacktestingMode,
  BacktestingService,
  BacktestingSetting,
} from './strategy/backtesting.service';

@Injectable()
export class AppService {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly backtestingService: BacktestingService,
  ) {
    this.test3();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async test1(): Promise<void> {
    const bars = await this.marketDataService.getBars({
      start: '2022-01-01',
      end: '2025-01-02',
      interval: Interval.MINUTE_15,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(bars);
  }

  async test2(): Promise<void> {
    const count = await this.marketDataService.downloadBars({
      start: '2025-01-01',
      // end: '2025-05-02',
      interval: Interval.MINUTE_15,
      symbol: 'BTCUSDT:USDT',
    });

    console.log(count);
  }

  async test3(): Promise<void> {
    // 1. 设置回测参数
    const setting: BacktestingSetting = {
      startDate: '2025-01-01',
      endDate: '2025-01-02',
      symbol: 'BTCUSDT:USDT',
      interval: Interval.MINUTE_15,
      capital: 50_000,
      commission: 0.0002,
      slippage: 0.0001,
      size: 1,
      priceTick: 0.01,
      mode: BacktestingMode.BAR,
    };
    this.backtestingService.setSetting(setting);

    // 2. 加载数据到引擎
    await this.backtestingService.loadData();

    // 3. 添加策略
    const strategyName = 'DoubleMaStrategy';
    const strategySetting = {
      fastWindow: 10,
      slowWindow: 20,
      fixedSize: 1,
    };

    this.backtestingService.addStrategy(DoubleMaStrategy, strategyName, strategySetting);
    console.log(`策略 ${strategyName} 添加完成`);

    // 4. 运行回测
    console.log('\n开始运行回测...');
    const startTime = Date.now();

    this.backtestingService.runBacktesting();

    const endTime = Date.now();
    console.log(`回测完成，耗时: ${endTime - startTime}ms\n`);

    // 6. 分析结果
    this.backtestingService.calculateResult(true);
  }
}
