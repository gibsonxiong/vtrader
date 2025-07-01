import { Module } from '@nestjs/common';

import { BacktestingController } from './backtesting.controller';
import { BacktestingService } from './backtesting.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BacktestingController],
  providers: [BacktestingService, PrismaService],
})
export class BacktestingModule {}
