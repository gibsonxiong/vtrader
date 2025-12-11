import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
// import { ScheduleModule } from '@nestjs/schedule';

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
import * as path from 'path';
import * as os from 'os';

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
          // 绑定到指定任务名，确保处理 add('run-backtest', ...) 的任务
          name: 'run-backtest',
          path: path.resolve(__dirname, './backtesting1.processor.js'),
          // 并发工作进程数量：优先取环境变量 BACKTEST_WORKERS，其次按 CPU 核心数-1
          concurrency: Number(process.env.BACKTEST_WORKERS) || Math.min(5, os.cpus().length - 1),
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
