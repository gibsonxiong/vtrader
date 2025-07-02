import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BacktestingModule } from './backtesting/backtesting.module';

@Module({
  imports: [ConfigModule.forRoot(), BacktestingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
