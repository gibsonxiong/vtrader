import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { BacktestingSetting } from 'src/types/backtesting';
import { MarketDataService } from 'src/market-data/market-data.service';
import { StrategyService } from 'src/strategy/strategy.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { PrismaService } from 'src/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import type { BacktestNotificationData } from 'src/types/notification';
import { BacktestingEngine } from 'src/backtesting/backtesting-engine';
import type { OptimizerSetting } from '../types/backtesting';


@Processor('backtesting')
export class BacktestingProcessor extends WorkerHost {
  private readonly logger = new Logger(BacktestingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
    private readonly strategyService: StrategyService,
    private readonly brokerManagerService: BrokerManagerService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<BacktestingSetting>) {
    const { data } = job;
    
    this.logger.log(`开始处理回测任务 ${job.id}: ${data.strategyName}`);
    
    // 更新任务进度
    await job.updateProgress(0);
    
    try {
      const backtestingEngie = new BacktestingEngine(
        this.strategyService,
        this.brokerManagerService,
      );
      // 设置回测参数
      await backtestingEngie.init(data);
      await job.updateProgress(20);
            
      // 运行回测
      await backtestingEngie.runBacktesting();
      await job.updateProgress(80);
      
      // 分析
      const result = await backtestingEngie.calculateResult();
      await job.updateProgress(90);

      // 保存结果
      const backtesting = await this.prisma.backtesting.create({
        data: {
          brokerId: result.brokerId,
          symbol: result.symbol,
          strategyName: result.strategyName,
          interval: result.interval,
          startDate: result.startDate,
          endDate: result.endDate,
          startBalance: result.startBalance,
          endBalance: result.endBalance,
          maxDrawdown: result.maxDrawdown,
          maxDrawdownPercent: result.maxDrawdownPercent,
          totalNetPnl: result.totalNetPnl,
          totalReturnPercent: result.totalReturnPercent,
          dailyResults: result.dailyResults as object,
          trades: result.trades as any[],
        }
      });
      await job.updateProgress(100);

      this.logger.log(`任务 ${job.id}: 结果计算完成，结果ID: ${backtesting.id}`);
      
      return { resultId: backtesting.id };
    } catch (error) {
      this.logger.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
      throw new Error(`回测失败: ${error.message}`);
    }
  }

  // @Process('optimizer')
  // async optimizer(job: Job<OptimizerSetting>) {
  //   const { data } = job;

  //   // 创建优化器
  //   const optimizer = OptimizerFactory.createOptimizer('grid', {
  //     hyperparameters: [
  //       {
  //         name: 'rsiWindow',
  //         type: 'continuous',
  //         range: [12, 16, 1]
  //       },
  //     ],
  //     maxTrials: 50,
  //     direction: data.optimizerDiretion,
  //     trainModel: async (setting: StrategySetting): Promise<number> => {
  //       console.log(`Training with:`, setting);
        
  //       const backtestingEngie = new BacktestingEngine(
  //         this.strategyService,
  //         this.brokerManagerService,
  //       );
  //       // 设置回测参数
  //       await backtestingEngie.init({
  //         ...data,
  //         strategySetting: setting
  //       });
              
  //       // 运行回测
  //       await backtestingEngie.runBacktesting();
        
  //       // 分析
  //       const result = await backtestingEngie.calculateResult();
        
  //       return result;
  //     }
  //   });

  //   const result = await optimizer.run();
  //   this.logger.log(`优化结果: ${JSON.stringify(result)}`);
  // }

  // @OnQueueCompleted()
  // async onCompleted(job: Job, result: any) {
  //   this.logger.log(`回测任务 ${job.id} 已完成`);
  //   this.logger.log(`任务结果: ${JSON.stringify(result)}`);
    
  //   // 这里可以添加任务完成后的处理逻辑
  //   // 例如：发送通知、更新缓存、触发其他业务逻辑等
  //   try {
  //     if (result.success && result.resultId) {
  //       // 可以在这里添加额外的后处理逻辑
  //       // 比如生成报告、发送邮件通知等
  //       this.logger.log(`回测结果已保存，ID: ${result.resultId}`);
        
  //       // 发送成功通知
  //       const setting = job.data as BacktestingSetting;
  //       const notificationData: BacktestNotificationData = {
  //         jobId: job.id.toString(),
  //         resultId: result.resultId,
  //         title: '回测任务完成',
  //         message: `策略 ${setting.strategyName} 的回测任务已成功完成`,
  //         type: 'success',
  //         strategyName: setting.strategyName,
  //         symbol: setting.symbol,
  //         startDate: setting.startDate,
  //         endDate: setting.endDate,
  //         metadata: {
  //           duration: job.processedOn ? Date.now() - job.processedOn : 0,
  //           resultId: result.resultId,
  //         },
  //       };
        
  //       await this.notificationService.sendBacktestCompletedNotification(notificationData);
        
  //       // 示例：可以在这里触发结果分析或报告生成
  //       // await this.generateBacktestReport(result.resultId);
  //     }
  //   } catch (error) {
  //     this.logger.error(`任务完成后处理失败: ${error.message}`, error.stack);
  //   }
  // }

  // @OnQueueFailed()
  // async onFailed(job: Job, error: Error) {
  //   this.logger.error(`回测任务 ${job.id} 执行失败`);
  //   this.logger.error(`失败原因: ${error.message}`, error.stack);
    
  //   // 这里可以添加任务失败后的处理逻辑
  //   // 例如：发送错误通知、记录错误日志、清理资源等
  //   try {
  //     // 记录失败信息到数据库或发送通知
  //     const setting = job.data as BacktestingSetting;
  //     this.logger.error(`失败的任务参数: ${JSON.stringify({
  //       strategyName: setting.strategyName,
  //       symbol: setting.symbol,
  //       startDate: setting.startDate,
  //       endDate: setting.endDate,
  //     })}`);
      
  //     // 发送失败通知
  //     const notificationData: BacktestNotificationData = {
  //       jobId: job.id.toString(),
  //       title: '回测任务失败',
  //       message: `策略 ${setting.strategyName} 的回测任务执行失败: ${error.message}`,
  //       type: 'error',
  //       strategyName: setting.strategyName,
  //       symbol: setting.symbol,
  //       startDate: setting.startDate,
  //       endDate: setting.endDate,
  //       metadata: {
  //         error: error.message,
  //         stack: error.stack,
  //         failedAt: Date.now(),
  //       },
  //     };
      
  //     await this.notificationService.sendBacktestFailedNotification(notificationData);
      
  //     // 示例：可以在这里发送失败通知
  //     // await this.sendFailureNotification(job.id, error.message);
  //   } catch (processingError) {
  //     this.logger.error(`任务失败后处理出错: ${processingError.message}`, processingError.stack);
  //   }
  // }

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
