import { Controller, Post, Body } from '@nestjs/common';
import { BacktestingApi } from '../types/backtesting';
import type { Response } from 'src/types/common';

import { BacktestingService } from './backtesting.service';
// import { BacktestingCleanupService } from './backtesting-cleanup.service';

import { response } from 'src/utils';



@Controller('backtesting')
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
    // private readonly cleanupService: BacktestingCleanupService,
  ) { }

  /**
   * 开始回测（异步）
   */
  @Post('create')
  async create(@Body() request: BacktestingApi.CreateRequest): Promise<Response<{ jobId: string; message: string }>> {
    const result = await this.backtestingService.createBacktesting(request);

    return response(result);
  }

  /**
   * 获取任务状态
   */
  @Post('job/status')
  async getJobStatus(@Body() body: { jobId: string }): Promise<Response<any>> {
    const status = await this.backtestingService.getJobStatus(body.jobId);

    return response(status);
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

  /**
   * 手动清理过期任务
   */
  // @Delete('cleanup')
  // async cleanup(@Query('beforeDate') beforeDate?: string): Promise<Response<{ deletedResults: number; deletedJobs: number }>> {
  //   try {
  //     let cleanupDate: Date;
      
  //     if (beforeDate) {
  //       cleanupDate = new Date(beforeDate);
  //       if (isNaN(cleanupDate.getTime())) {
  //         throw new Error('无效的日期格式');
  //       }
  //     } else {
  //       // 默认清理7天前的数据
  //       cleanupDate = new Date();
  //       cleanupDate.setDate(cleanupDate.getDate() - 7);
  //     }

  //     const result = await this.cleanupService.cleanupTasksBefore(cleanupDate);
  //     return response(result);
  //   } catch (error) {
  //     return response({ deletedResults: 0, deletedJobs: 0 }, error.message);
  //   }
  // }

  // /**
  //  * 获取清理统计信息
  //  */
  // @Get('cleanup/stats')
  // async getCleanupStats(): Promise<Response<any>> {
  //   try {
  //     const stats = await this.cleanupService.getCleanupStats();
  //     return response(stats);
  //   } catch (error) {
  //     return response(null, error.message);
  //   }
  // }
}
