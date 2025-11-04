import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrokerManagerModule } from './broker-manager/broker-manager.module';
import { MarketDataModule } from './market-data/market-data.module';
import { StrategyModule } from './strategy/strategy.module';
import { BacktestingModule } from './backtesting/backtesting.module';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    StrategyModule, 
    BacktestingModule, 
    MarketDataModule,
    BrokerManagerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
