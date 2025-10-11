// /**
//  * 超参数优化执行示例
//  * 不依赖Controller，直接使用OptimizationService
//  */

// import { OptimizationService } from './optimization.service';
// import { OptimizationSetting } from './optimization-setting';
// import { BacktestingService, BacktestingSetting } from '../backtesting.service';
// import { MarketDataService } from '../../market-data/market-data.service';
// import { StrategyService } from '../strategy.service';
// import { PrismaService } from '../../prisma.service';
// import { BrokerManagerService } from '../../broker-manager/broker-manager.service';
// import { Interval } from 'src/shared/types/common';

// /**
//  * 手动实例化所有依赖服务
//  */
// function createServices() {
//   // 创建基础服务
//   const prismaService = new PrismaService();
//   const brokerManagerService = new BrokerManagerService();
//   const marketDataService = new MarketDataService(prismaService, brokerManagerService);
//   const strategyService = new StrategyService();
//   const backtestingService = new BacktestingService(marketDataService, strategyService);
//   const optimizationService = new OptimizationService(backtestingService);

//   return {
//     optimizationService,
//     backtestingService,
//     strategyService,
//     marketDataService,
//     prismaService,
//     brokerManagerService
//   };
// }

// /**
//  * 网格策略参数优化示例
//  */
// export async function gridStrategyOptimizationExample() {
//   console.log('=== 网格策略超参数优化示例 ===\n');

//   // 1. 创建服务实例
//   const { optimizationService } = createServices();

//   // 2. 设置回测基础参数
//   const backtestingSetting: BacktestingSetting = {
//     startDate: '2024-01-01',
//     endDate: '2024-12-31',
//     symbols: ['BTCUSDT:USDT'],
//     interval: Interval.MINUTE_1,
//     balance: 100000,
//     commissionRate: 0.0004,
//     priceTick: 0.01,
//     strategies: [] // 将在优化过程中动态设置
//   };

//   // 3. 配置优化参数
//   const optimizationSetting = new OptimizationSetting();

//   // 添加网格策略的优化参数
//   optimizationSetting.addParameter('gridStep', 0.001, 0.005, 0.001); // 网格步长: 0.001-0.005，步进0.001
//   optimizationSetting.addParameter('gridSize', 5, 20, 5); // 网格数量: 5-20，步进5
//   optimizationSetting.addParameter('basePosCount', 10, 30, 10); // 基础仓位: 10-30，步进10
//   optimizationSetting.addDiscreteParameter('useAdjustGrid', [true, false]); // 是否调整网格

//   // 设置优化目标 - 总收益率
//   optimizationSetting.setTarget('totalReturn');

//   // 4. 验证设置
//   const validation = optimizationSetting.isValid();
//   if (!validation.valid) {
//     console.error('优化设置无效：', validation.message);
//     return;
//   }

//   console.log('优化参数组合数量：', optimizationSetting.generateSettings().length);
//   console.log('优化目标：', optimizationSetting.targetName);
//   console.log('开始优化...\n');

//   try {
//     // 5. 执行穷举法优化
//     console.log('--- 穷举法优化 ---');
//     const bruteForceResults = await optimizationService.runBruteForceOptimization(
//       optimizationSetting,
//       backtestingSetting,
//       'GridStrategy',
//       4, // 最大并发数
//       (msg) => console.log(`[穷举] ${msg}`)
//     );

//     console.log('\n穷举法优化结果（前5名）：');
//     bruteForceResults.slice(0, 5).forEach((result, index) => {
//       console.log(`第${index + 1}名:`);
//       console.log(`  参数:`, result.params);
//       console.log(`  目标值:`, result.target.toFixed(6));
//       console.log(`  详细结果:`, {
//         totalReturn: result.result.totalReturn?.toFixed(4),
//         sharpeRatio: result.result.sharpeRatio?.toFixed(4),
//         maxDrawdownPercent: result.result.maxDrawdownPercent?.toFixed(4),
//         totalTradeCount: result.result.totalTradeCount
//       });
//       console.log('');
//     });

//     // 6. 执行遗传算法优化
//     console.log('\n--- 遗传算法优化 ---');
//     const geneticResults = await optimizationService.runGeneticOptimization(
//       optimizationSetting,
//       backtestingSetting,
//       'GridStrategy',
//       50, // 种群大小
//       20, // 迭代次数
//       (msg) => console.log(`[遗传] ${msg}`)
//     );

//     console.log('\n遗传算法优化结果（前5名）：');
//     geneticResults.slice(0, 5).forEach((result, index) => {
//       console.log(`第${index + 1}名:`);
//       console.log(`  参数:`, result.params);
//       console.log(`  目标值:`, result.target.toFixed(6));
//       console.log(`  详细结果:`, {
//         totalReturn: result.result.totalReturn?.toFixed(4),
//         sharpeRatio: result.result.sharpeRatio?.toFixed(4),
//         maxDrawdownPercent: result.result.maxDrawdownPercent?.toFixed(4),
//         totalTradeCount: result.result.totalTradeCount
//       });
//       console.log('');
//     });

//     // 7. 比较两种算法的最优结果
//     console.log('\n--- 算法比较 ---');
//     const bestBruteForce = bruteForceResults[0];
//     const bestGenetic = geneticResults[0];

//     console.log('穷举法最优结果：');
//     console.log(`  目标值: ${bestBruteForce.target.toFixed(6)}`);
//     console.log(`  参数: ${JSON.stringify(bestBruteForce.params)}`);

//     console.log('\n遗传算法最优结果：');
//     console.log(`  目标值: ${bestGenetic.target.toFixed(6)}`);
//     console.log(`  参数: ${JSON.stringify(bestGenetic.params)}`);

//     const improvement = ((bestBruteForce.target - bestGenetic.target) / bestGenetic.target * 100);
//     console.log(`\n穷举法相比遗传算法提升: ${improvement.toFixed(2)}%`);

//   } catch (error) {
//     console.error('优化过程中发生错误：', error);
//   }
// }

// /**
//  * 多目标优化示例
//  */
// export async function multiObjectiveOptimizationExample() {
//   console.log('\n=== 多目标优化示例 ===\n');

//   const { optimizationService } = createServices();

//   const backtestingSetting: BacktestingSetting = {
//     startDate: '2024-01-01',
//     endDate: '2024-06-30',
//     symbols: ['BTCUSDT:USDT', 'ETHUSDT:USDT'],
//     interval: Interval.MINUTE_5,
//     balance: 50000,
//     commissionRate: 0.0004,
//     priceTick: 0.01,
//     strategies: []
//   };

//   // 分别优化不同目标
//   const targets = ['totalReturn', 'sharpeRatio', 'returnDrawdownRatio'];
  
//   for (const target of targets) {
//     console.log(`\n--- 优化目标: ${target} ---`);
    
//     const setting = new OptimizationSetting();
//     setting.addParameter('gridStep', 0.002, 0.008, 0.002);
//     setting.addParameter('gridSize', 8, 16, 4);
//     setting.setTarget(target);

//     try {
//       const results = await optimizationService.runGeneticOptimization(
//         setting,
//         backtestingSetting,
//         'GridStrategy',
//         30, // 较小的种群
//         15, // 较少的迭代
//         (msg) => console.log(`[${target}] ${msg}`)
//       );

//       const best = results[0];
//       console.log(`最优${target}结果:`);
//       console.log(`  参数: ${JSON.stringify(best.params)}`);
//       console.log(`  ${target}: ${best.target.toFixed(6)}`);
//       console.log(`  综合指标:`, {
//         totalReturn: best.result.totalReturn?.toFixed(4),
//         sharpeRatio: best.result.sharpeRatio?.toFixed(4),
//         returnDrawdownRatio: best.result.returnDrawdownRatio?.toFixed(4)
//       });
//     } catch (error) {
//       console.error(`优化${target}时出错:`, error);
//     }
//   }
// }

// /**
//  * 参数敏感性分析示例
//  */
// export async function parameterSensitivityExample() {
//   console.log('\n=== 参数敏感性分析示例 ===\n');

//   const { optimizationService } = createServices();

//   const backtestingSetting: BacktestingSetting = {
//     startDate: '2024-01-01',
//     endDate: '2024-03-31',
//     symbols: ['BTCUSDT:USDT'],
//     interval: Interval.MINUTE_1,
//     balance: 100000,
//     commissionRate: 0.0004,
//     priceTick: 0.01,
//     strategies: []
//   };

//   // 单参数敏感性测试
//   const parameters = [
//     { name: 'gridStep', range: [0.001, 0.010, 0.001] },
//     { name: 'gridSize', range: [5, 25, 2] },
//     { name: 'basePosCount', range: [5, 50, 5] }
//   ];

//   for (const param of parameters) {
//     console.log(`\n--- ${param.name} 敏感性分析 ---`);
    
//     const setting = new OptimizationSetting();
//     setting.addParameter(param.name, param.range[0], param.range[1], param.range[2]);
//     // 其他参数设为固定值
//     if (param.name !== 'gridStep') setting.addParameter('gridStep', 0.003);
//     if (param.name !== 'gridSize') setting.addParameter('gridSize', 10);
//     if (param.name !== 'basePosCount') setting.addParameter('basePosCount', 20);
    
//     setting.setTarget('totalReturn');

//     try {
//       const results = await optimizationService.runBruteForceOptimization(
//         setting,
//         backtestingSetting,
//         'GridStrategy',
//         2, // 降低并发避免过载
//         (msg) => console.log(`[${param.name}] ${msg}`)
//       );

//       console.log(`${param.name} 影响分析:`);
//       results.forEach((result, index) => {
//         if (index < 5) { // 只显示前5个
//           console.log(`  ${param.name}=${result.params[param.name]}: 收益率=${result.target.toFixed(4)}`);
//         }
//       });

//       // 计算最佳参数值
//       const best = results[0];
//       console.log(`  最佳${param.name}值: ${best.params[param.name]}`);
      
//     } catch (error) {
//       console.error(`分析${param.name}时出错:`, error);
//     }
//   }
// }

// /**
//  * 主执行函数
//  */
// export async function runOptimizationExamples() {
//   console.log('开始执行超参数优化示例...\n');

//   try {
//     // 执行网格策略优化示例
//     await gridStrategyOptimizationExample();

//     // 执行多目标优化示例
//     await multiObjectiveOptimizationExample();

//     // 执行参数敏感性分析示例
//     await parameterSensitivityExample();

//     console.log('\n=== 所有优化示例执行完成 ===');
//   } catch (error) {
//     console.error('执行示例时发生错误：', error);
//   }
// }

// // 如果直接运行此文件
// if (require.main === module) {
//   runOptimizationExamples().catch(console.error);
// }
