import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MenuModule } from './menu/menu.module';
import { BrokerManagerModule } from './broker-manager/broker-manager.module';
import { MarketDataModule } from './market-data/market-data.module';
import { StrategyModule } from './strategy/strategy.module';
import { BacktestingModule } from './backtesting/backtesting.module';
import { WsGateway } from './ws/ws.gateway';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    AuthModule,
    UserModule,
    MenuModule,
    StrategyModule,
    BacktestingModule,
    MarketDataModule,
    BrokerManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway],
})
export class AppModule {}
