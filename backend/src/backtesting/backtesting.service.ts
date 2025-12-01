import {
  BarData,
  Offset,
  OrderData,
  TradeData,
  Direction,
  Interval,
  OrderStatus,
  OrderType,
} from '@vtrader/shared';
import dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BacktestingSetting } from '@vtrader/shared';
import { PrismaService } from '../prisma.service';
import type { Backtesting, Prisma } from '@vtrader/shared/prismaClient';

@Injectable()
export class BacktestingService {
  constructor(
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  // 新的异步回测方法，使用队列
  async createBacktesting(setting: BacktestingSetting): Promise<{ jobId: string; message: string }> {
    const job = await this.backtestingQueue.add('run-backtest', setting, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return {
      jobId: job.id.toString(),
      message: '回测任务已提交，正在后台处理...',
    };
  }

  getBacktestingResult(id: number): Promise<Backtesting | null> {
    return this.prisma.backtesting.findUnique({
      where: {
        id,
      }
    });
  }

  async getBacktestingResults(params: Prisma.BacktestingFindManyArgs): Promise<{ data: Backtesting[], total: number }> {
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
    const progress = job.progress();
    
    return {
      status: state,
      progress,
      data: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
