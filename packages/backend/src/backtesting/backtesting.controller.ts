import { Controller, Post, Body } from '@nestjs/common';
import { BacktestingApi } from '../types/backtesting';
import type { BacktestingModel, BacktestingSetting, JobStatusResult, OptimizerSetting } from '../types/backtesting';
import type { Response } from '../types/common';

import { BacktestingService } from './backtesting.service';
// import { BacktestingCleanupService } from './backtesting-cleanup.service';

import { response } from '../utils';
import {
  CreateBacktestingDto,
  QueryBacktestingDto,
  QueryManyBacktestingDto,
  RemoveBacktestingDto,
  JobStatusDto,
} from './dto/backtesting.dto';



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
  async create(@Body() request: CreateBacktestingDto): Promise<Response<{ jobId: string; message: string }>> {
    const result = await this.backtestingService.createBacktesting(request);

    return response(result);
  }

  /**
   * 开始参数优化（异步）
   */
  @Post('optimization')
  async optimization(@Body() request: OptimizerSetting): Promise<Response<{ jobId: string; message: string }>> {
    const result = await this.backtestingService.optimization(request);
    return response(result);
  }

  /**
   * 获取任务状态
   */
  @Post('job/status')
  async getJobStatus(@Body() body: JobStatusDto): Promise<Response<JobStatusResult>> {
    const status = await this.backtestingService.getJobStatus(body.jobId);

    return response(status);
  }

  /**
   * 获取回测结果
   */
  @Post('query')
  async query(@Body() request: QueryBacktestingDto): Promise<Response<BacktestingApi.QueryResponse>> {
    const backtestingResult = await this.backtestingService.getBacktestingResult(request.id);

    return response({ model: backtestingResult });
  }

  /**
   * 获取回测历史列表
   */
  @Post('queryMany')
  async queryMany(@Body() request: QueryManyBacktestingDto): Promise<Response<BacktestingApi.QueryManyResponse>> {
    const { data, total } = await this.backtestingService.getBacktestingResults(request as any);
    return response({ models: data, total });
  }

  /** 删除回测历史 */
  @Post('remove')
  async remove(@Body() request: RemoveBacktestingDto): Promise<Response<BacktestingApi.RemoveResponse>> {
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
