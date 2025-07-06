import { Module } from '@nestjs/common';

import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';

@Module({
  imports: [MarketDataModule],
  controllers: [BacktestingController],
  providers: [BacktestingService, PrismaService],
  exports: [BacktestingService],
})
export class BacktestingModule {}
