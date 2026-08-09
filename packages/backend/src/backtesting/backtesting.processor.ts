import { Queue, SandboxedJob, QueueEvents, Worker } from 'bullmq';
import { BacktestingEngine } from './backtesting-engine';
import { MarketDataService } from '../market-data/market-data.service';
import { BrokerManagerService } from '../broker/broker-manager.service';
import { BrokerService } from '../broker/broker.service';
import { Broker } from '../entities/broker.entity';
import { Backtesting } from '../entities/backtesting.entity';
import { StrategyService } from '../strategy/strategy.service';
import { getORM } from '../database/get-orm';
import type { BacktestingSetting } from '../types/backtesting';
import type { Interval } from '../types/common';
import type { OptimizerSetting, TrialResult } from '../types/backtesting';
import { OptimizerFactory } from '../optimization/index';
import { pathToFileURL } from 'url';
import path from 'path';

// 进程级单例（只创建一次）
let ormInitPromise: ReturnType<typeof getORM> | null = null;
let services: {
  brokerService: BrokerService;
  brokerManagerService: BrokerManagerService;
  marketDataService: MarketDataService;
  strategyService: StrategyService;
} | null = null;

async function getServices() {
  if (services) return services;
  const orm = await (ormInitPromise ??= getORM());
  const em = orm.em;
  const brokerService = new BrokerService(em, em.getRepository(Broker));
  await brokerService.refreshCache();
  const brokerManagerService = new BrokerManagerService(brokerService);
  const marketDataService = new MarketDataService(brokerManagerService, brokerService, undefined);
  const strategyService = new StrategyService();
  services = { brokerService, brokerManagerService, marketDataService, strategyService };
  return services;
}

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

async function backtesting(job: SandboxedJob<BacktestingSetting>) {
  const { data: setting } = job;
  console.log(`开始处理回测任务 ${job.id}: ${setting.strategyName}`);

  const { brokerManagerService, marketDataService, strategyService } = await getServices();
  const engine = new BacktestingEngine(strategyService, brokerManagerService);

  try {
    await job.updateProgress(0);
    await engine.init({
      ...setting,
      dataLoader: async (symbol: string, interval: Interval, preloadCount: number) => {
        const bars = await marketDataService.getBarsFromDb({
          brokerType: setting.brokerType,
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

    await engine.loadData();
    await job.updateProgress(50);
    console.log(`任务 ${job.id}: 数据加载完成`);

    await engine.runBacktesting();
    await job.updateProgress(80);
    const result = await engine.calculateResult();

    const orm = await (ormInitPromise ??= getORM());
    const em = orm.em.fork();
    const backtesting = em.create(Backtesting, {
      brokerId: result.brokerType,
      symbol: result.symbol,
      strategyName: result.strategyName,
      interval: result.interval,
      startDate: result.startDate,
      endDate: result.endDate,
      startBalance: String(result.startBalance),
      endBalance: String(result.endBalance),
      maxDrawdown: String(result.maxDrawdown),
      maxDrawdownPercent: String(result.maxDrawdownPercent),
      totalNetPnl: String(result.totalNetPnl),
      totalReturnPercent: String(result.totalReturnPercent),
      dailyResults: result.dailyResults as object,
      trades: result.trades,
      createdAt: new Date(),
    });
    await em.persistAndFlush(backtesting);

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

  const { brokerManagerService } = await getServices();

  const queueName = 'backtesting-optimizer-'+job.id;
  const queue = new Queue(queueName, {connection});
  const worker = new Worker(queueName, pathToFileURL(path.resolve(__dirname, './backtesting.processor.js')), {
    connection,
    concurrency: 10,
    useWorkerThreads: true,
  });
  const queueEvents = new QueueEvents(queueName, {connection});
  
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
