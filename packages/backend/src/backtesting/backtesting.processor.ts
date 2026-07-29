import { Queue, SandboxedJob, QueueEvents, Worker } from 'bullmq';
import { BacktestingEngine } from './backtesting-engine';
import { MarketDataService } from 'src/market-data/market-data.service';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { StrategyService } from 'src/strategy/strategy.service';
import type { BacktestingSetting } from '../types/backtesting';
import type { Interval } from '../types/common';
import type { OptimizerSetting, TrialResult } from '../types/backtesting';
import { OptimizerFactory } from 'src/optimization/index';
import { pathToFileURL } from 'url';
import path from 'path';

const prisma = new PrismaService();
const brokerManagerService = new BrokerManagerService();
const marketDataService = new MarketDataService(brokerManagerService);
const strategyService = new StrategyService();
const backtestingEngie = new BacktestingEngine(
  strategyService,
  brokerManagerService,
);
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

async function backtesting(job: SandboxedJob<BacktestingSetting>) {
  const { data: setting } = job;
  console.log(`开始处理回测任务 ${job.id}: ${setting.strategyName}`);
  
  try {
    // 更新任务进度
    await job.updateProgress(0);
    // 设置回测参数
    await backtestingEngie.init({
      ...setting,
      dataLoader: async (symbol: string, interval: Interval, preloadCount: number) => {
        const bars = await marketDataService.getBarsFromDb({
          brokerId: setting.brokerId,
          symbol: symbol,
          interval: interval,
          startDate: setting.startDate,
          endDate: setting.endDate,
          preload: preloadCount,
        });
        return bars.list;
      }
    });
    await job.updateProgress(20);
    console.log(`任务 ${job.id}: 参数设置完成`);
    
    // 加载数据
    await backtestingEngie.loadData();
    await job.updateProgress(50);
    console.log(`任务 ${job.id}: 数据加载完成`);
    
    // 运行回测
    await backtestingEngie.runBacktesting();
    await job.updateProgress(80);
    const result = await backtestingEngie.calculateResult();

    const backtesting = await prisma.backtesting.create({
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
    console.log(`任务 ${job.id}: 结果计算完成，结果ID: ${backtesting.id}`);
    
    return { 
      resultId: backtesting.id,
      result,
    };
  } catch (error) {
    console.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
    throw new Error(`回测失败: ${error.message}`);
  }
}

async function optimization(job: SandboxedJob<OptimizerSetting>): Promise<{ resultId?: string } | TrialResult[]> {
  const { data } = job;
  console.log(`开始处理超优化任务 ${job.id}: ${data.strategyName}`);

  // 创建新队列
  const queueName = 'backtesting-optimizer-'+job.id;
  const queue = new Queue(queueName, {connection});
  const worker = new Worker(queueName, pathToFileURL(path.resolve(__dirname, './backtesting.processor.js')), {
    connection,
    concurrency: 10,
    useWorkerThreads: true,
  });
  const queueEvents = new QueueEvents(queueName, {connection});
  
  // 创建优化器
  const optimizer = OptimizerFactory.createOptimizer('grid', {
    ...data,
    trainModel: async (strategySetting: Record<string, any>): Promise<number> => {
      console.log(`strategySetting:`, strategySetting);
      
      const job = await queue.add('backtesting', {
        ...data,
        strategySetting,
      });

      const result = await job.waitUntilFinished(queueEvents);

      console.log('#result', result)
      return result.result.totalReturnPercent;
    }
  });

  await optimizer.run();

  const result = optimizer.trials;

  return result;
}

export default async function (job: SandboxedJob<any>) {
  const { name } = job;
    
  if (name === 'backtesting') {
    return backtesting(job);
  } else if (name === 'optimization') {
    return optimization(job);
  } else {
    throw new Error(`未知的任务名称: ${name}`);
  }
}
