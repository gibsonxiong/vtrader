import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { BacktestingSetting } from '@vtrader/shared';
import { MarketDataService } from '../market-data/market-data.service';
import { StrategyService } from '../strategy/strategy.service';
import { BrokerManagerService } from '../broker-manager/broker-manager.service';
import { PrismaService } from '../prisma.service';
import { NotificationService, BacktestNotificationData } from '../notification/notification.service';
import { Backtesting } from './backtesting';

@Injectable()
@Processor('backtesting')
export class BacktestingProcessor {
  private readonly logger = new Logger(BacktestingProcessor.name);

  constructor(
    // private readonly backtestingService: BacktestingService,
    private readonly marketDataService: MarketDataService,
    private readonly strategyService: StrategyService,
    private readonly brokerManagerService: BrokerManagerService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Process('run-backtest')
  async handleBacktest(job: Job<BacktestingSetting>) {
    const { data } = job;
    
    this.logger.log(`开始处理回测任务 ${job.id}: ${data.strategy.strategyName}`);
    
    // 更新任务进度
    await job.progress(0);
    
    try {
      const backtesting = new Backtesting(
        this.marketDataService,
        this.strategyService,
        this.brokerManagerService,
        this.prisma,
      );
      // 设置回测参数
      await backtesting.setSetting(data);
      await job.progress(20);
      this.logger.log(`任务 ${job.id}: 参数设置完成`);
      
      // 加载数据
      await backtesting.loadData();
      await job.progress(50);
      this.logger.log(`任务 ${job.id}: 数据加载完成`);
      
      // 运行回测
      await backtesting.runBacktesting();
      await job.progress(80);
      this.logger.log(`任务 ${job.id}: 回测运行完成`);
      
      // 计算结果
      const resultId = await backtesting.calculateResult();
      await job.progress(100);
      this.logger.log(`任务 ${job.id}: 结果计算完成，结果ID: ${resultId}`);
      
      return { resultId };
    } catch (error) {
      this.logger.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
      throw new Error(`回测失败: ${error.message}`);
    }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: any) {
    this.logger.log(`回测任务 ${job.id} 已完成`);
    this.logger.log(`任务结果: ${JSON.stringify(result)}`);
    
    // 这里可以添加任务完成后的处理逻辑
    // 例如：发送通知、更新缓存、触发其他业务逻辑等
    try {
      if (result.success && result.resultId) {
        // 可以在这里添加额外的后处理逻辑
        // 比如生成报告、发送邮件通知等
        this.logger.log(`回测结果已保存，ID: ${result.resultId}`);
        
        // 发送成功通知
        const jobData = job.data as BacktestingSetting;
        const notificationData: BacktestNotificationData = {
          jobId: job.id.toString(),
          resultId: result.resultId,
          title: '回测任务完成',
          message: `策略 ${jobData.strategy.strategyName} 的回测任务已成功完成`,
          type: 'success',
          strategyName: jobData.strategy.strategyName,
          symbols: Array.isArray(jobData.symbols) ? jobData.symbols : [jobData.symbols],
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          metadata: {
            duration: job.processedOn ? Date.now() - job.processedOn : 0,
            resultId: result.resultId,
          },
        };
        
        await this.notificationService.sendBacktestCompletedNotification(notificationData);
        
        // 示例：可以在这里触发结果分析或报告生成
        // await this.generateBacktestReport(result.resultId);
      }
    } catch (error) {
      this.logger.error(`任务完成后处理失败: ${error.message}`, error.stack);
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(`回测任务 ${job.id} 执行失败`);
    this.logger.error(`失败原因: ${error.message}`, error.stack);
    
    // 这里可以添加任务失败后的处理逻辑
    // 例如：发送错误通知、记录错误日志、清理资源等
    try {
      // 记录失败信息到数据库或发送通知
      const jobData = job.data as BacktestingSetting;
      this.logger.error(`失败的任务参数: ${JSON.stringify({
        strategyName: jobData.strategy.strategyName,
        symbols: jobData.symbols,
        startDate: jobData.startDate,
        endDate: jobData.endDate,
      })}`);
      
      // 发送失败通知
      const notificationData: BacktestNotificationData = {
        jobId: job.id.toString(),
        title: '回测任务失败',
        message: `策略 ${jobData.strategy.strategyName} 的回测任务执行失败: ${error.message}`,
        type: 'error',
        strategyName: jobData.strategy.strategyName,
        symbols: Array.isArray(jobData.symbols) ? jobData.symbols : [jobData.symbols],
        startDate: jobData.startDate,
        endDate: jobData.endDate,
        metadata: {
          error: error.message,
          stack: error.stack,
          failedAt: Date.now(),
        },
      };
      
      await this.notificationService.sendBacktestFailedNotification(notificationData);
      
      // 示例：可以在这里发送失败通知
      // await this.sendFailureNotification(job.id, error.message);
    } catch (processingError) {
      this.logger.error(`任务失败后处理出错: ${processingError.message}`, processingError.stack);
    }
  }

  // 私有方法：生成回测报告（示例）
  // private async generateBacktestReport(resultId: number): Promise<void> {
  //   try {
  //     // 这里可以实现报告生成逻辑
  //     this.logger.log(`开始生成回测报告，结果ID: ${resultId}`);
  //     // 实际的报告生成逻辑...
  //   } catch (error) {
  //     this.logger.error(`生成回测报告失败: ${error.message}`, error.stack);
  //   }
  // }

  // 私有方法：发送失败通知（示例）
  // private async sendFailureNotification(jobId: string, errorMessage: string): Promise<void> {
  //   try {
  //     // 这里可以实现通知发送逻辑
  //     this.logger.log(`发送失败通知，任务ID: ${jobId}`);
  //     // 实际的通知发送逻辑...
  //   } catch (error) {
  //     this.logger.error(`发送失败通知出错: ${error.message}`, error.stack);
  //   }
  // }
}
