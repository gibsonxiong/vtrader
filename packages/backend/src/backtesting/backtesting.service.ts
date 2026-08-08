import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MarketDataService } from '../market-data/market-data.service';
import { BacktestingSetting } from '../types/backtesting';
import { Backtesting } from '../entities/backtesting.entity';
import type { OptimizerSetting } from '../types/backtesting';

@Injectable()
export class BacktestingService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Backtesting)
    private readonly repo: EntityRepository<Backtesting>,
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
    private readonly marketDataService: MarketDataService,
  ) {}

  async createBacktesting(setting: BacktestingSetting): Promise<{ jobId: string; message: string }> {
    const job = await this.backtestingQueue.add('backtesting', setting, {
      attempts: 0,
    });

    return {
      jobId: job.id!,
      message: '回测任务已提交，正在后台处理...',
    };
  }

  async optimization(setting: OptimizerSetting) {
    const job = await this.backtestingQueue.add('optimization', setting, {
      attempts: 0,
    });

    return {
      jobId: job.id!,
      message: '回测任务已提交，正在后台处理...',
    };
  }

  getBacktestingResult(id: number): Promise<Backtesting | null> {
    return this.repo.findOne({ id });
  }

  async getBacktestingResults(params: {
    where?: Record<string, any>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, any>;
  }): Promise<{ data: Backtesting[]; total: number }> {
    const { where, skip = 0, take = 10, orderBy = { id: 'DESC' as const } } = params;

    const whereClause: Record<string, any> = {};
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (value !== '') {
          whereClause[key] = value;
        }
      }
    }

    const [data, total] = await Promise.all([
      this.repo.find(whereClause, { orderBy, offset: skip, limit: take }),
      this.repo.count(whereClause),
    ]);
    return { data, total };
  }

  async removeBacktesting(id: number): Promise<void> {
    await this.repo.nativeDelete({ id });
  }

  async getJobStatus(jobId: string) {
    const job = await this.backtestingQueue.getJob(jobId);

    if (!job) {
      return { status: 'unkown', failedReason: '任务不存在' };
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
