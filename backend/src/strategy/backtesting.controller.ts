import { Controller, Get, Param, Post, Body } from '@nestjs/common';

import { BacktestingService, type BacktestingSetting } from './backtesting.service';
import { Interval } from 'src/shared/types/common';

@Controller('backtesting')
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
  ) { }

  /**
   * 开始回测
   */
  @Post('start')
  async startBacktest(@Body() backtestData: BacktestingSetting): Promise<any> {
    const backtestingResult = await this.backtestingService.backtesting(backtestData);

    return { 
      code: 0, 
      msg: '成功',
      data: backtestingResult
    }
  }

  
}
