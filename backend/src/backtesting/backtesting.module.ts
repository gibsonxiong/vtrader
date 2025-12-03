import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { MarketDataModule } from '../market-data/market-data.module';
import { StrategyModule } from 'src/strategy/strategy.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { BacktestingProcessor } from './backtesting.processor';
import { BacktestingCleanupService } from './backtesting-cleanup.service';
import { BrokerManagerModule } from 'src/broker-manager/broker-manager.module';
import { NotificationModule } from '../notification/notification.module';
import { BacktestingRumTime } from './backtesting.runtime';

@Module({
  imports: [
    MarketDataModule, 
    BrokerManagerModule, 
    StrategyModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'backtesting',
    }),
  ],
  controllers: [BacktestingController],
  providers: [BacktestingService, BacktestingProcessor, BacktestingCleanupService, PrismaService, BacktestingRumTime],
  exports: [BacktestingService],
})
export class BacktestingModule {}
