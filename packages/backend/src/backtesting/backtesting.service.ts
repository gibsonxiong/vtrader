import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
} from '../types/common';
import dayjs from 'dayjs';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MarketDataService } from '../market-data/market-data.service';
import { BacktestingSetting } from '../types/backtesting';
import { PrismaService } from '../prisma.service';
import type { Backtesting as BacktestingModel, Prisma } from '../../generated/client';
import { BacktestingEngine } from './backtesting-engine';
import type { OptimizerConfig, OptimizerSetting } from '../types/backtesting';

@Injectable()
export class BacktestingService {
  constructor(
    private moduleRef: ModuleRef,
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
    private readonly marketDataService: MarketDataService,
    private readonly prisma: PrismaService,
  ) {
  }
  // 新的异步回测方法，使用队列
  async createBacktesting(setting: BacktestingSetting): Promise<{ jobId: string; message: string }> {
    const job = await this.backtestingQueue.add('backtesting', setting, {
      attempts: 0,
      // backoff: {
      //   type: 'exponential',
      //   delay: 2000,
      // },
    });

    return {
      jobId: job.id!,
      message: '回测任务已提交，正在后台处理...',
    };
  }

  // async createBacktestingSync(setting: BacktestingSetting): Promise<void> {
  //   try {
  //     const engine = await this.moduleRef.resolve(BacktestingEngine);

  //     if (!setting.data && !setting.dataLoader) {
  //       setting.dataLoader = async (symbol: string, interval: Interval, preloadCount: number) => {
  //         const bars = await this.marketDataService.getBarsFromDb({
  //           brokerType: setting.brokerType,
  //           symbol: symbol,
  //           interval: interval,
  //           startDate: setting.startDate,
  //           endDate: setting.endDate,
  //           preload: preloadCount,
  //         });
  //         return bars.list;
  //       }
  //     }

  //     // 设置回测参数
  //     await engine.init(setting);
            
  //     // 运行回测
  //     await engine.runBacktesting();
      
  //     // 计算结果
  //     const result = await engine.calculateResult();
  //     console.log(`结果计算完成，结果: `, result);
      
  //   } catch (error) {
  //     console.error(`执行失败: ${error.message}`, error.stack);
  //     throw new Error(`回测失败: ${error.message}`);
  //   }
  // }

  async optimization(setting: OptimizerSetting) {
    const job = await this.backtestingQueue.add('optimization', setting, {
      attempts: 0,
      // backoff: {
      //   type: 'exponential',
      //   delay: 2000,
      // },
    });

    return {
      jobId: job.id!,
      message: '回测任务已提交，正在后台处理...',
    };
  }

  getBacktestingResult(id: number): Promise<BacktestingModel | null> {
    return this.prisma.backtesting.findUnique({
      where: {
        id,
      }
    });
  }

  async getBacktestingResults(params: Prisma.BacktestingFindManyArgs): Promise<{ data: BacktestingModel[], total: number }> {
    const { where, skip, take, orderBy } = params;

    console.log(where)
    // 过滤掉空字符串的where查询
    if (where) {
      Object.keys(where).forEach(key => {
        if (where[key] === '') {
          delete where[key];
        }
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.backtesting.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || {
          id: 'desc'
        }
      }),
      this.prisma.backtesting.count({
        where
      })
    ]);
    return { data, total };
  }

  /**
   * 删除回测历史
   */
  async removeBacktesting(id: number): Promise<void> {
    await this.prisma.backtesting.delete({
      where: {
        id,
      }
    });
  }

  // 获取任务状态
  async getJobStatus(jobId: string) {
    const job = await this.backtestingQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found', message: '任务不存在' };
    }

    const state = await job.getState();
    const progress = job.progress;
    
    return {
      status: state,
      progress,
      data: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
