import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BacktestingCleanupService {
  private readonly logger = new Logger(BacktestingCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('backtesting') private readonly backtestingQueue: Queue,
  ) {}

  /**
   * 每天凌晨2点执行清理任务
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTasks() {
    this.logger.log('开始清理过期的回测任务...');

    try {
      // 清理7天前的已完成任务
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 清理数据库中的过期结果（基于ID范围，假设ID是递增的）
      // 注意：由于Backtesting模型没有createdAt字段，这里使用简单的ID范围清理
      // 在实际生产环境中，建议在schema中添加createdAt字段
      const oldRecords = await this.prisma.backtesting.findMany({
        select: { id: true },
        orderBy: { id: 'desc' },
        skip: 1000, // 保留最新的1000条记录
      });

      let deletedResults = { count: 0 };
      if (oldRecords.length > 0) {
        const oldestIdToKeep = oldRecords[oldRecords.length - 1].id;
        deletedResults = await this.prisma.backtesting.deleteMany({
          where: {
            id: {
              lt: oldestIdToKeep,
            },
          },
        });
      }

      this.logger.log(`已清理 ${deletedResults.count} 个过期的回测结果`);

      // 清理队列中的已完成和失败任务
      const completedJobs = await this.backtestingQueue.getCompleted();
      const failedJobs = await this.backtestingQueue.getFailed();

      let cleanedJobsCount = 0;

      // 清理7天前的已完成任务
      for (const job of completedJobs) {
        if (job.finishedOn && job.finishedOn < sevenDaysAgo.getTime()) {
          await job.remove();
          cleanedJobsCount++;
        }
      }

      // 清理7天前的失败任务
      for (const job of failedJobs) {
        if (job.failedReason && job.finishedOn && job.finishedOn < sevenDaysAgo.getTime()) {
          await job.remove();
          cleanedJobsCount++;
        }
      }

      this.logger.log(`已清理 ${cleanedJobsCount} 个过期的队列任务`);

      // 清理超过30天的所有任务（包括等待中的任务）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const waitingJobs = await this.backtestingQueue.getWaiting();
      const activeJobs = await this.backtestingQueue.getActive();

      let cleanedOldJobsCount = 0;

      // 清理超过30天的等待任务
      for (const job of waitingJobs) {
        if (job.timestamp < thirtyDaysAgo.getTime()) {
          await job.remove();
          cleanedOldJobsCount++;
        }
      }

      // 记录但不清理活跃任务（正在执行的任务）
      const oldActiveJobs = activeJobs.filter(job => job.timestamp < thirtyDaysAgo.getTime());
      if (oldActiveJobs.length > 0) {
        this.logger.warn(`发现 ${oldActiveJobs.length} 个超过30天的活跃任务，需要手动检查`);
      }

      this.logger.log(`已清理 ${cleanedOldJobsCount} 个超过30天的等待任务`);

      this.logger.log('回测任务清理完成');
    } catch (error) {
      this.logger.error(`清理回测任务时发生错误: ${error.message}`, error.stack);
    }
  }

  /**
   * 每小时清理失败的任务（保留最近24小时的失败任务用于调试）
   */
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

  /**
   * 手动清理指定时间之前的任务
   */
  async cleanupTasksBefore(beforeDate: Date) {
    this.logger.log(`开始清理 ${beforeDate.toISOString()} 之前的任务...`);

    try {
      // 清理过期的回测结果（基于ID范围，由于没有createdAt字段）
      // 注意：这里使用简化的清理策略，实际生产环境建议添加时间戳字段
      const allRecords = await this.prisma.backtesting.findMany({
        select: { id: true },
        orderBy: { id: 'desc' },
      });

      // 假设保留最新的500条记录，删除其余的
      let deletedResults = { count: 0 };
      if (allRecords.length > 500) {
        const recordsToDelete = allRecords.slice(500);
        const idsToDelete = recordsToDelete.map(record => record.id);
        
        deletedResults = await this.prisma.backtesting.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
      }

      // 清理队列任务
      const allJobs = [
        ...(await this.backtestingQueue.getCompleted()),
        ...(await this.backtestingQueue.getFailed()),
        ...(await this.backtestingQueue.getWaiting()),
      ];

      let cleanedJobsCount = 0;
      for (const job of allJobs) {
        const jobDate = job.finishedOn || job.timestamp;
        if (jobDate < beforeDate.getTime()) {
          await job.remove();
          cleanedJobsCount++;
        }
      }

      this.logger.log(`手动清理完成: 删除了 ${deletedResults.count} 个结果和 ${cleanedJobsCount} 个队列任务`);

      return {
        deletedResults: deletedResults.count,
        deletedJobs: cleanedJobsCount,
      };
    } catch (error) {
      this.logger.error(`手动清理任务时发生错误: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取清理统计信息
   */
  async getCleanupStats() {
    try {
      const [
        totalResults,
        completedJobs,
        failedJobs,
        waitingJobs,
        activeJobs,
      ] = await Promise.all([
        this.prisma.backtesting.count(),
        this.backtestingQueue.getCompleted(),
        this.backtestingQueue.getFailed(),
        this.backtestingQueue.getWaiting(),
        this.backtestingQueue.getActive(),
      ]);

      return {
        database: {
          totalResults,
        },
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