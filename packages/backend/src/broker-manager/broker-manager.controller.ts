import { Controller, Post } from '@nestjs/common';

import { BrokerManagerService } from './broker-manager.service';
import { response } from 'src/utils';

@Controller('broker-manager')
export class BrokerManagerController {
  constructor(private readonly brokerMgr: BrokerManagerService) {}

  @Post('getConfigs')
  getBrokerConfigs() {
    const data = this.brokerMgr.getBrokerConfigs();
    return response(data);
  }
}
