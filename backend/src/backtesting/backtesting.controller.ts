import { Controller, Post, Body, Query } from '@nestjs/common';
import { Response } from '@vtrader/shared';
import { BacktestingApi } from '@vtrader/shared';

import { BacktestingService } from './backtesting.service';

import { response } from 'src/utils';



@Controller('backtesting')
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
  ) { }

  /**
   * 开始回测
   */
  @Post('create')
  async create(@Body() request: BacktestingApi.CreateRequest): Promise<Response<BacktestingApi.CreateResponse>> {
    const id = await this.backtestingService.backtesting(request);

    return response({ id });
  }

  /**
   * 获取回测结果
   */
  @Post('query')
  async query(@Body() request: BacktestingApi.QueryRequest): Promise<Response<BacktestingApi.QueryResponse>> {
    const backtestingResult = await this.backtestingService.getBacktestingResult(request.id);

    return response({ model: backtestingResult });
  }

  /**
   * 获取回测历史列表
   */
  @Post('queryMany')
  async queryMany(@Body() request: BacktestingApi.QueryManyRequest): Promise<Response<BacktestingApi.QueryManyResponse>> {
    const { data, total } = await this.backtestingService.getBacktestingResults(request);
    console.log({ data, total });
    return response({ models: data, total });
  }

  /** 删除回测历史 */
  @Post('remove')
  async remove(@Body() request: BacktestingApi.RemoveRequest): Promise<Response<BacktestingApi.RemoveResponse>> {
    await this.backtestingService.removeBacktesting(request.id);

    return response();
  }
}
