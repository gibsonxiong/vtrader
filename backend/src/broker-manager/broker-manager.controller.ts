import { Controller, Post, Param, NotFoundException } from '@nestjs/common';

import { BrokerManagerService } from './broker-manager.service';
import type { BrokerConfig } from './broker-manager.service';

@Controller('broker-manager')
export class BrokerManagerController {
  constructor(private readonly brokerMgr: BrokerManagerService) {}

  @Post('getConfigs')
  getBrokerConfigs(): BrokerConfig[] {
    return this.brokerMgr.getBrokerConfigs();
  }
}
