import { parentPort, workerData } from 'worker_threads';
import { Direction, Interval, Offset } from '../../types/common';
import { BacktestingService, BacktestingSetting } from '../backtesting.service';
import { MarketDataService } from '../../market-data/market-data.service';
import { StrategyService } from '../strategy.service';
import { PrismaService } from '../../prisma.service';
import { BrokerManagerService } from '../../broker-manager/broker-manager.service';

console.log('workdata', parentPort, workerData);

async function main(): Promise<void> {
  // 1. 设置回测参数
  const setting: BacktestingSetting = {
    startDate: '2025-07-08',
    endDate: '2025-07-23',
    symbols: ['BTCUSDT:USDT', 'ETHUSDT:USDT'],
    interval: Interval.MINUTE_1,
    balance: 100_000,
    commissionRate: 0.0005,
    size: 1,
    priceTick: 0.01,
    strategies: [
      // {
      //   strategyName: 'MyStrategy',
      //   strategySetting: {
      //     rsiWindow: 20,
      //   },
      // },
      // {
      //   strategyName: 'RSIStrategy',
      //   strategySetting: {
      //     rsiWindow: 20,
      //   },
      // },
      {
        strategyName: 'GridStrategy',
        strategySetting: {
          // rsiWindow: 20,
        },
      },
    ],
  };

  const prismaService = new PrismaService();
  const brokerManagerService = new BrokerManagerService();
  const marketDataService = new MarketDataService(prismaService, brokerManagerService);
  const strategyService = new StrategyService();
  const backtestingService = new BacktestingService(marketDataService, strategyService);
  await backtestingService.backtesting(setting);

  parentPort?.postMessage('123')
}

main();
