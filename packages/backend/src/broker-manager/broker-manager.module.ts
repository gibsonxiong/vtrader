import { Module } from '@nestjs/common';

import { BrokerManagerService } from './broker-manager.service';
import { BrokerConfigService } from './broker-config.service';
import { BrokerConfigController } from './broker-config.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BrokerConfigController],
  providers: [BrokerManagerService, BrokerConfigService, PrismaService],
  exports: [BrokerManagerService, BrokerConfigService],
})
export class BrokerManagerModule {}
