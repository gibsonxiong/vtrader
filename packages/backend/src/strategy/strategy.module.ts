import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';

@Module({
  imports: [MarketDataModule],
  controllers: [
    StrategyController,
  ],
  providers: [
    StrategyService,
  ],
  exports: [
    StrategyService,
  ],
})
export class StrategyModule {}
