import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BacktestingModule } from './backtesting/backtesting.module';

@Module({
  imports: [BacktestingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
