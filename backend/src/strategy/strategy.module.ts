import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { StrategyService } from './strategy.service';
import { BacktestingService } from './backtesting.service';
import { OptimizationService } from './optimization/optimization.service';
import { OptimizationController } from './optimization/optimization.controller';

@Module({
  imports: [MarketDataModule],
  controllers: [BacktestingController, OptimizationController],
  providers: [StrategyService, BacktestingService, OptimizationService, PrismaService],
  exports: [StrategyService, BacktestingService, OptimizationService],
})
export class StrategyModule {}
