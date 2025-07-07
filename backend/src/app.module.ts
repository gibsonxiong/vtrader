import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketDataModule } from './market-data/market-data.module';
import { BacktestingModule } from './strategy/backtesting.module';
import { BrokerManagerModule } from './broker-manager/broker-manager.module';

@Module({
  imports: [ConfigModule.forRoot(), BacktestingModule, MarketDataModule, BrokerManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
