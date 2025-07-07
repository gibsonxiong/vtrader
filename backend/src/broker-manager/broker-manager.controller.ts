import { Controller } from '@nestjs/common';

import { BrokerManagerService } from './broker-manager.service';

@Controller('broker-manager')
export class BrokerManagerController {
  constructor(private readonly brokerMgr: BrokerManagerService) {}
}
