import { BacktestingEngine, BacktestingMode } from '../backtesting-engine';
// import { DataLoaderFactory, DataSourceType } from '../data-loader';
import { DoubleMaStrategy } from '../strategies/double-ma-strategy';

/**
 * 回测示例类
 * 展示如何使用CTA回测引擎进行策略回测
 */
export class BacktestExample {
  private engine: BacktestingEngine;

  constructor() {
    this.engine = new BacktestingEngine();
  }

  /**
   * CSV数据回测示例
   */
  // public async runCsvDataExample(): Promise<void> {
  //   console.log('=== CSV数据回测示例 ===\n');

  //   try {
  //     // 重置引擎
  //     this.engine = new BacktestingEngine();

  //     // 1. 设置回测参数
  //     this.engine.setStartDate(new Date('2023-01-01'));
  //     this.engine.setEndDate(new Date('2023-12-31'));
  //     this.engine.setCapital(50_000);
  //     this.engine.setCommission(0.0002);
  //     this.engine.setSlippage(0.0001);
  //     this.engine.setSize(1);
  //     this.engine.setPriceTick(0.01);
  //     this.engine.setBacktestingMode(BacktestingMode.BAR);

  //     // 2. 配置CSV数据加载器
  //     const dataConfig = {
  //       symbol: 'AAPL',
  //       startDate: new Date('2023-01-01'),
  //       endDate: new Date('2023-12-31'),
  //       interval: Interval.DAILY,
  //       sourceType: DataSourceType.CSV,
  //       sourcePath: './data/AAPL_2023.csv', // 示例CSV文件路径
  //     };

  //     const csvConfig = {
  //       delimiter: ',',
  //       hasHeader: true,
  //       dateFormat: 'YYYY-MM-DD',
  //       columns: {
  //         datetime: 0,
  //         open: 1,
  //         high: 2,
  //         low: 3,
  //         close: 4,
  //         volume: 5,
  //       },
  //     };

  //     // 3. 创建数据加载器
  //     const dataLoader = DataLoaderFactory.createLoader(dataConfig, { csvConfig });

  //     // 4. 加载数据
  //     console.log('正在从CSV文件加载数据...');
  //     const barData = await dataLoader.loadBars();
  //     console.log(`从CSV加载了 ${barData.length} 条K线数据`);

  //     this.engine.setMockBars(barData);

  //     // 5. 添加策略
  //     const strategyName = 'DoubleMaStrategy_CSV';
  //     const strategySetting = {
  //       fastWindow: 5,
  //       slowWindow: 15,
  //       fixedSize: 1,
  //     };

  //     this.engine.addStrategy(DoubleMaStrategy, strategyName, dataConfig.symbol, strategySetting);

  //     // 6. 运行回测
  //     console.log('\n开始运行回测...');
  //     const result = this.engine.runBacktesting();

  //     // 7. 分析结果
  //     this.engine.showBacktestingResult();
  //   } catch (error) {
  //     console.error('CSV回测运行失败:', error);
  //   }
  // }

  /**
   * 运行双均线策略回测示例
   */
  public async runDoubleMaExample(): Promise<void> {
    console.log('=== 双均线策略回测示例 ===\n');

    try {
      // 1. 设置回测参数
      this.engine.setStartDate(new Date('2023-01-01'));
      this.engine.setEndDate(new Date('2023-12-31'));
      this.engine.setCapital(100_000);
      this.engine.setCommission(0.0003); // 0.03% 手续费
      this.engine.setSlippage(0.0001); // 0.01% 滑点
      this.engine.setSize(1); // 每手大小
      this.engine.setPriceTick(0.01); // 最小价格变动
      this.engine.setBacktestingMode(BacktestingMode.BAR);

      console.log('回测参数设置完成');

      // 2. 生成模拟数据
      const symbol = 'BTCUSDT';

      // 3. 加载数据到引擎
      await this.engine.loadData();

      // 4. 添加策略
      const strategyName = 'DoubleMaStrategy';
      const strategySetting = {
        fastWindow: 10,
        slowWindow: 20,
        fixedSize: 1,
      };

      this.engine.addStrategy(DoubleMaStrategy, strategyName, symbol, strategySetting);
      console.log(`策略 ${strategyName} 添加完成`);

      // 5. 运行回测
      console.log('\n开始运行回测...');
      const startTime = Date.now();

      const result = this.engine.runBacktesting();

      const endTime = Date.now();
      console.log(`回测完成，耗时: ${endTime - startTime}ms\n`);

      // 6. 分析结果
      this.engine.showBacktestingResult();
    } catch (error) {
      console.error('回测运行失败:', error);
    }
  }

  // /**
  //  * 参数优化示例
  //  */
  // public async runParameterOptimization(): Promise<void> {
  //   console.log('=== 参数优化示例 ===\n');

  //   try {
  //     const symbol = 'BTCUSDT';
  //     const startDate = new Date('2023-01-01');
  //     const endDate = new Date('2023-12-31');
  //     const interval = '1h';

  //     // 生成测试数据
  //     const mockData = MockDataGenerator.generateBars(symbol, startDate, endDate, interval, 25000);

  //     const optimizationResults: any[] = [];

  //     // 参数范围
  //     const fastWindows = [5, 10, 15, 20];
  //     const slowWindows = [20, 30, 40, 50];

  //     console.log('开始参数优化...');

  //     for (const fastWindow of fastWindows) {
  //       for (const slowWindow of slowWindows) {
  //         if (fastWindow >= slowWindow) continue; // 快线周期必须小于慢线周期

  //         // 重置引擎
  //         this.engine = new BacktestingEngine();

  //         // 设置参数
  //         this.engine.setStartDate(startDate);
  //         this.engine.setEndDate(endDate);
  //         this.engine.setCapital(100000);
  //         this.engine.setCommission(0.0003);
  //         this.engine.setSlippage(0.0001);
  //         this.engine.setSize(1);
  //         this.engine.setPriceTick(0.01);
  //         this.engine.setBacktestingMode(BacktestingMode.BAR);

  //         // 加载数据
  //         this.engine.setMockBars(mockData);

  //         // 添加策略
  //         const strategyName = `DoubleMa_${fastWindow}_${slowWindow}`;
  //         const strategySetting = {
  //           fastWindow,
  //           slowWindow,
  //           fixedSize: 1
  //         };

  //         this.engine.addStrategy(DoubleMaStrategy, strategyName, symbol, strategySetting);

  //         // 运行回测
  //         const result = this.engine.runBacktesting();

  //         // 分析结果
  //         const trades = this.engine.getTrades();
  //         const equityHistory = this.engine.getEquityHistory();

  //         if (equityHistory.length > 0) {
  //           const analyzer = new ResultAnalyzer(trades, equityHistory);
  //           const analysis = analyzer.analyze();

  //           optimizationResults.push({
  //             fastWindow,
  //             slowWindow,
  //             totalReturn: analysis.summary.totalReturn,
  //             totalReturnPercent: analysis.summary.totalReturnPercent,
  //             maxDrawdown: analysis.drawdownAnalysis.maxDrawdownPercent,
  //             sharpeRatio: analysis.riskMetrics.sharpeRatio,
  //             winRate: analysis.tradeStats.winRate,
  //             totalTrades: analysis.tradeStats.totalTrades
  //           });
  //         }

  //         console.log(`完成参数组合: 快线=${fastWindow}, 慢线=${slowWindow}`);
  //       }
  //     }

  //     // 输出优化结果
  //     console.log('\n=== 参数优化结果 ===\n');

  //     // 按总收益率排序
  //     optimizationResults.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);

  //     console.log('按总收益率排序的前5个参数组合:');
  //     console.log('快线\t慢线\t总收益(%)\t最大回撤(%)\t夏普比率\t胜率(%)\t交易次数');
  //     console.log('--------------------------------------------------------------------');

  //     for (let i = 0; i < Math.min(5, optimizationResults.length); i++) {
  //       const result = optimizationResults[i];
  //       console.log(
  //         `${result.fastWindow}\t${result.slowWindow}\t` +
  //         `${result.totalReturnPercent.toFixed(2)}\t\t` +
  //         `${result.maxDrawdown.toFixed(2)}\t\t` +
  //         `${result.sharpeRatio.toFixed(2)}\t\t` +
  //         `${result.winRate.toFixed(2)}\t` +
  //         `${result.totalTrades}`
  //       );
  //     }

  //     // 按夏普比率排序
  //     optimizationResults.sort((a, b) => b.sharpeRatio - a.sharpeRatio);

  //     console.log('\n按夏普比率排序的前5个参数组合:');
  //     console.log('快线\t慢线\t总收益(%)\t最大回撤(%)\t夏普比率\t胜率(%)\t交易次数');
  //     console.log('--------------------------------------------------------------------');

  //     for (let i = 0; i < Math.min(5, optimizationResults.length); i++) {
  //       const result = optimizationResults[i];
  //       console.log(
  //         `${result.fastWindow}\t${result.slowWindow}\t` +
  //         `${result.totalReturnPercent.toFixed(2)}\t\t` +
  //         `${result.maxDrawdown.toFixed(2)}\t\t` +
  //         `${result.sharpeRatio.toFixed(2)}\t\t` +
  //         `${result.winRate.toFixed(2)}\t` +
  //         `${result.totalTrades}`
  //       );
  //     }

  //   } catch (error) {
  //     console.error('参数优化失败:', error);
  //   }
  // }

  // /**
  //  * 输出详细结果
  //  */
  // private printDetailedResults(analysis: any): void {
  //   console.log('=== 详细统计信息 ===\n');

  //   // 月度收益
  //   if (analysis.monthlyReturns.length > 0) {
  //     console.log('月度收益:');
  //     console.log('年份\t月份\t收益\t收益率(%)');
  //     console.log('--------------------------------');

  //     for (const monthlyReturn of analysis.monthlyReturns) {
  //       console.log(
  //         `${monthlyReturn.year}\t${monthlyReturn.month}\t` +
  //         `${monthlyReturn.return.toFixed(2)}\t${monthlyReturn.returnPercent.toFixed(2)}`
  //       );
  //     }
  //     console.log('');
  //   }

  //   // 年度收益
  //   if (analysis.yearlyReturns.length > 0) {
  //     console.log('年度收益:');
  //     console.log('年份\t收益\t收益率(%)');
  //     console.log('------------------------');

  //     for (const yearlyReturn of analysis.yearlyReturns) {
  //       console.log(
  //         `${yearlyReturn.year}\t${yearlyReturn.return.toFixed(2)}\t${yearlyReturn.returnPercent.toFixed(2)}`
  //       );
  //     }
  //     console.log('');
  //   }

  //   // 回撤期间
  //   if (analysis.drawdownAnalysis.drawdownPeriods.length > 0) {
  //     console.log('主要回撤期间:');
  //     console.log('开始日期\t\t结束日期\t\t回撤(%)\t持续天数');
  //     console.log('--------------------------------------------------------');

  //     const sortedDrawdowns = analysis.drawdownAnalysis.drawdownPeriods
  //       .sort((a: any, b: any) => b.drawdownPercent - a.drawdownPercent)
  //       .slice(0, 5); // 显示前5个最大回撤

  //     for (const drawdown of sortedDrawdowns) {
  //       console.log(
  //         `${drawdown.startDate.toLocaleDateString()}\t\t` +
  //         `${drawdown.endDate.toLocaleDateString()}\t\t` +
  //         `${drawdown.drawdownPercent.toFixed(2)}\t\t${drawdown.duration}`
  //       );
  //     }
  //   }
  // }
}

/**
 * 运行所有示例
 */
async function main(): Promise<void> {
  const example = new BacktestExample();

  try {
    // 运行双均线策略示例
    await example.runDoubleMaExample();

    // console.log('\n' + '='.repeat(80) + '\n');

    // // 运行CSV数据示例
    // await example.runCsvDataExample();

    // console.log('\n' + '='.repeat(80) + '\n');

    // 运行参数优化示例
    // await example.runParameterOptimization();
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

main();
