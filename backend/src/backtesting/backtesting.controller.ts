import { Controller, Get, Param, Post, Body, ParseIntPipe } from '@nestjs/common';

import { BacktestingService } from './backtesting.service';
import { BacktestingSetting, BacktestingResult } from 'src/shared/types/backtesting';

@Controller('backtesting')
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
  ) { }

  /**
   * 开始回测
   */
  @Post()
  async startBacktest(@Body() backtestData: BacktestingSetting): Promise<any> {
    const backtestingResult = await this.backtestingService.backtesting(backtestData);

    return { 
      code: 0, 
      msg: '成功',
      data: backtestingResult
    }
  }

  /**
   * 获取回测结果
   */
  @Get(':id')
  async getBacktestResult(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const backtestingResult = await this.backtestingService.getBacktestingResult(id);

    return { 
      code: 0, 
      msg: '成功',
      data: backtestingResult
    }
  }

  /**
   * 获取所有回测结果
   */
  @Get()
  async getAllBacktestResults(): Promise<any> {
    const backtestingResults = await this.backtestingService.getBacktestingResults();

    return { 
      code: 0, 
      msg: '成功',
      data: backtestingResults
    }
  }
}
