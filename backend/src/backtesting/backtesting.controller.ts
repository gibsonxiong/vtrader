import { Controller, Post, Body, Query } from '@nestjs/common';
import { Response } from '@vtrader/shared';
import { CreateRequest, CreateResponse, QueryRequest, QueryResponse, QueryManyRequest, QueryManyResponse } from '@vtrader/shared';

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
  async create(@Body() request: CreateRequest): Promise<Response<CreateResponse>> {
    const id = await this.backtestingService.backtesting(request);

    return response({ id });
  }

  /**
   * 获取回测结果
   */
  @Post('query')
  async query(@Body() request: QueryRequest): Promise<Response<QueryResponse>> {
    const backtestingResult = await this.backtestingService.getBacktestingResult(request.id);

    return response({ model: backtestingResult });
  }

  /**
   * 获取回测历史列表
   */
  @Post('queryMany')
  async queryMany(@Body() request: QueryManyRequest): Promise<Response<QueryManyResponse>> {
    const backtestingResults = await this.backtestingService.getBacktestingResults(request);

    return response({ models: backtestingResults });
  }
}
