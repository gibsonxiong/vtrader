import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';

@Module({
  controllers: [BacktestingController],
  providers: [BacktestingService, PrismaService],
})
export class BacktestingModule {}
