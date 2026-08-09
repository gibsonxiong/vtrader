import * as path from 'path';
import * as os from 'os';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { pathToFileURL } from 'url';

import { MarketDataModule } from '../market-data/market-data.module';
import { StrategyModule } from '../strategy/strategy.module';
import { BrokerModule } from '../broker/broker.module';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { BacktestingEngine } from './backtesting-engine';
import { Backtesting } from '../entities/backtesting.entity';
import { NotificationModule } from '../notification/notification.module';


@Module({
  imports: [
    MarketDataModule, 
    BrokerModule, 
    StrategyModule,
    NotificationModule,
    MikroOrmModule.forFeature([Backtesting]),
    BullModule.registerQueue({
      name: 'backtesting',
      processors: [
        {
          path: pathToFileURL(path.resolve(__dirname, './backtesting.processor.js')),
          concurrency: Number(process.env.BACKTEST_WORKERS) || Math.min(5, os.cpus().length - 1),
          useWorkerThreads: true,
        },
      ],
    }),
  ],
  controllers: [BacktestingController],
  providers: [
    BacktestingService, 
    BacktestingEngine
  ],
  exports: [BacktestingService],
})
export class BacktestingModule {}
