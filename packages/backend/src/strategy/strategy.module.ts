import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaService } from '../prisma.service';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';
// import { OptimizationService } from './optimization/optimization.service';
// import { OptimizationController } from './optimization/optimization.controller';

@Module({
  imports: [MarketDataModule],
  controllers: [
    StrategyController,
  ],
  providers: [
    StrategyService,
    PrismaService
  ],
  exports: [
    StrategyService,
  ],
})
export class StrategyModule {}
