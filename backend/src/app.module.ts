import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketDataModule } from './market-data/market-data.module';
import { BacktestingModule } from './strategy/backtesting.module';

@Module({
  imports: [ConfigModule.forRoot(), BacktestingModule, MarketDataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
