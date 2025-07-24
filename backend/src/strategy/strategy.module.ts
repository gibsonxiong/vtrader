import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { StrategyService } from './strategy.service';
import { BacktestingService } from './backtesting.service';

@Module({
  imports: [MarketDataModule],
  controllers: [BacktestingController],
  providers: [
    StrategyService,
    BacktestingService,
    PrismaService
  ],
  exports: [
    StrategyService,
    BacktestingService
  ],
})
export class StrategyModule {}
