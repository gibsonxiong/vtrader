import { Controller } from '@nestjs/common';

import { BacktestingService } from './backtesting.service';

@Controller('backtesting')
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}
}
