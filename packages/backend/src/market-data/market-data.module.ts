import { Module } from '@nestjs/common';

import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { BrokerManagerModule } from 'src/broker-manager/broker-manager.module';

@Module({
  imports: [BrokerManagerModule],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
