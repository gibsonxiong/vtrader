import * as path from 'path';
import * as os from 'os';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
// import { ScheduleModule } from '@nestjs/schedule';
import { pathToFileURL } from 'url';

import { MarketDataModule } from '../market-data/market-data.module';
import { StrategyModule } from 'src/strategy/strategy.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
// import { BacktestingProcessor } from './backtesting.processor';
// import { BacktestingCleanupService } from './backtesting-cleanup.service';
import { BrokerManagerModule } from 'src/broker-manager/broker-manager.module';
import { NotificationModule } from '../notification/notification.module';
import { BacktestingEngine } from './backtesting-engine';


@Module({
  imports: [
    MarketDataModule, 
    BrokerManagerModule, 
    StrategyModule,
    NotificationModule,
    // ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'backtesting',
      processors: [
        {
          path: pathToFileURL(path.resolve(__dirname, './backtesting.processor.js')),
          // 并发工作进程数量：优先取环境变量 BACKTEST_WORKERS，其次按 CPU 核心数-1
          concurrency: Number(process.env.BACKTEST_WORKERS) || Math.min(5, os.cpus().length - 1),
          useWorkerThreads: true,
        },
      ],
    }),
  ],
  controllers: [BacktestingController],
  providers: [
    // BacktestingProcessor,
    BacktestingService, 
    // BacktestingCleanupService, 
    PrismaService, 
    BacktestingEngine
  ],
  exports: [BacktestingService],
})
export class BacktestingModule {}
