import { Module } from '@nestjs/common';

import { BrokerManagerController } from './broker-manager.controller';
import { BrokerManagerService } from './broker-manager.service';

@Module({
  controllers: [BrokerManagerController],
  providers: [BrokerManagerService],
  exports: [BrokerManagerService],
})
export class BrokerManagerModule {}
