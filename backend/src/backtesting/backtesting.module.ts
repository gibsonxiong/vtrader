import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { StrategyModule } from 'src/strategy/strategy.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { BrokerManagerModule } from 'src/broker-manager/broker-manager.module';

@Module({
  imports: [MarketDataModule, BrokerManagerModule, StrategyModule],
  controllers: [BacktestingController],
  providers: [BacktestingService, PrismaService],
  exports: [BacktestingService],
})
export class BacktestingModule {}
