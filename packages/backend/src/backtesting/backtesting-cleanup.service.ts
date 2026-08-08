import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Backtesting } from '../entities/backtesting.entity';

@Injectable()
export class BacktestingCleanupService {
  private readonly logger = new Logger(BacktestingCleanupService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Backtesting)
    private readonly repo: EntityRepository<Backtesting>,
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTasks() {
    this.logger.log('开始清理过期的回测任务...');

    try {
      const oldRecords = await this.repo.findAll({
        orderBy: { id: 'DESC' },
        offset: 1000,
        limit: 10000,
      });

      let deletedCount = 0;
      if (oldRecords.length > 0) {
        const oldestIdToKeep = oldRecords[oldRecords.length - 1].id;
        deletedCount = await this.repo.nativeDelete({ id: { $lt: oldestIdToKeep } });
      }

      this.logger.log(`已清理 ${deletedCount} 个过期的回测结果`);

      // 清理队列中的任务...
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const completedJobs = await this.backtestingQueue.getCompleted();
      const failedJobs = await this.backtestingQueue.getFailed();

      let cleanedJobsCount = 0;
      for (const job of [...completedJobs, ...failedJobs]) {
        if (job.finishedOn && job.finishedOn < sevenDaysAgo.getTime()) {
          await job.remove();
          cleanedJobsCount++;
        }
      }

      this.logger.log(`已清理 ${cleanedJobsCount} 个过期的队列任务`);
    } catch (error) {
      this.logger.error(`清理回测任务时发生错误: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupFailedTasks() {
    this.logger.log('开始清理失败的回测任务...');

    try {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const failedJobs = await this.backtestingQueue.getFailed();
      let cleanedCount = 0;

      for (const job of failedJobs) {
        if (job.finishedOn && job.finishedOn < oneDayAgo.getTime()) {
          await job.remove();
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`已清理 ${cleanedCount} 个24小时前的失败任务`);
      }
    } catch (error) {
      this.logger.error(`清理失败任务时发生错误: ${error.message}`, error.stack);
    }
  }

  async getCleanupStats() {
    try {
      const totalResults = await this.repo.count();
      const [completedJobs, failedJobs, waitingJobs, activeJobs] = await Promise.all([
        this.backtestingQueue.getCompleted(),
        this.backtestingQueue.getFailed(),
        this.backtestingQueue.getWaiting(),
        this.backtestingQueue.getActive(),
      ]);

      return {
        database: { totalResults },
        queue: {
          completed: completedJobs.length,
          failed: failedJobs.length,
          waiting: waitingJobs.length,
          active: activeJobs.length,
        },
      };
    } catch (error) {
      this.logger.error(`获取清理统计信息时发生错误: ${error.message}`, error.stack);
      throw error;
    }
  }
}
