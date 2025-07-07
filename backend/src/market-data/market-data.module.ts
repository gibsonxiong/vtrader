import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { BrokerManagerModule } from 'src/broker-manager/broker-manager.module';

@Module({
  imports: [BrokerManagerModule],
  controllers: [MarketDataController],
  providers: [MarketDataService, PrismaService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
