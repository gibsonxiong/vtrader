import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { BrokerModule } from './broker/broker.module';
import { MarketDataModule } from './market-data/market-data.module';
import { StrategyModule } from './strategy/strategy.module';
import { BacktestingModule } from './backtesting/backtesting.module';
import { WsGateway } from './ws/ws.gateway';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      {
        name: 'backtesting',
        adapter: BullMQAdapter,
      },
      {
        name: 'market-data-download',
        adapter: BullMQAdapter,
      },
    ),
    StrategyModule,
    BacktestingModule,
    MarketDataModule,
    BrokerModule,
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway],
})
export class AppModule {}
