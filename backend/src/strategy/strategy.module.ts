import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaService } from '../prisma.service';
import { StrategyController } from './strategy.controller';
import { BacktestingController } from './backtesting.controller';
import { StrategyService } from './strategy.service';
import { BacktestingService } from './backtesting.service';
import { OptimizationService } from './optimization/optimization.service';
import { OptimizationController } from './optimization/optimization.controller';

@Module({
  imports: [MarketDataModule],
  controllers: [
    StrategyController,
    BacktestingController
  ],
  providers: [
    StrategyService,
    BacktestingService,
    OptimizationService,
    PrismaService
  ],
  exports: [
    StrategyService,
    BacktestingService,
    OptimizationService
  ],
})
export class StrategyModule {}
