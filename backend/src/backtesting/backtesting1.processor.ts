import { Job, DoneCallback } from 'bull';
import { BacktestingEngine } from './backtesting-engine';
import { MarketDataService } from 'src/market-data/market-data.service';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { StrategyService } from 'src/strategy/strategy.service';

export default async function (job: Job, cb: DoneCallback) {
  const { data } = job;
    
  console.log(`开始处理回测任务 ${job.id}: ${data.strategy.strategyName}`);
  
  try {
    // 更新任务进度
    await job.progress(0);
    const prisma = new PrismaService();
    const brokerManagerService = new BrokerManagerService();
    const strategyService = new StrategyService();
    const marketDataService = new MarketDataService(
      prisma,
      brokerManagerService,
    );
    const backtestingEngie = new BacktestingEngine(
      marketDataService,
      strategyService,
      brokerManagerService,
    );
    // 设置回测参数
    await backtestingEngie.setSetting(data);
    await job.progress(20);
    console.log(`任务 ${job.id}: 参数设置完成`);
    
    // 加载数据
    await backtestingEngie.loadData();
    await job.progress(50);
    console.log(`任务 ${job.id}: 数据加载完成`);
    
    // 运行回测
    await backtestingEngie.runBacktesting();
    await job.progress(80);
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
    await job.progress(100);
    console.log(`任务 ${job.id}: 结果计算完成，结果ID: ${backtesting.id}`);
    
    cb(null, { resultId: backtesting.id });
  } catch (error) {
    console.error(`任务 ${job.id} 执行失败: ${error.message}`, error.stack);
    throw new Error(`回测失败: ${error.message}`);
  }
}
