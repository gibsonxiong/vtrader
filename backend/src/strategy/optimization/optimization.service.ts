import { Injectable } from '@nestjs/common';
import { BacktestingService, BacktestingSetting } from '../backtesting.service';
import { OptimizationSetting } from './optimization-setting';
import { GeneticAlgorithm, Individual } from './genetic-algorithm';
import { EvaluateFunc, KeyFunc, OptimizationResult, OutputFunc } from './types';

@Injectable()
export class OptimizationService {
  constructor(private readonly backtestingService: BacktestingService) {}

  /**
   * 创建评估函数
   */
  private createEvaluateFunction(
    backtestingSetting: BacktestingSetting,
    strategyName: string
  ): EvaluateFunc {
    return async (params: Record<string, any>) => {
      // 创建新的回测设置
      const testSetting: BacktestingSetting = {
        ...backtestingSetting,
        strategies: [{
          strategyName,
          strategySetting: params,
          weight: 1
        }]
      };

      // 执行回测
      await this.backtestingService.backtesting(testSetting);
      
      // 获取策略结果（假设只有一个策略）
      const strategies = (this.backtestingService as any).strategies;
      if (strategies && strategies.length > 0) {
        const strategy = strategies[0];
        return strategy.backtestingResult || {};
      }

      return {};
    };
  }

  /**
   * 获取目标值函数
   */
  private getTargetValueFunction(targetName: string): KeyFunc {
    return (result: Record<string, any>) => {
      return result[targetName] || 0;
    };
  }

  /**
   * 穷举法优化
   */
  async runBruteForceOptimization(
    optimizationSetting: OptimizationSetting,
    backtestingSetting: BacktestingSetting,
    strategyName: string,
    maxWorkers: number = 4,
    outputFunc?: OutputFunc
  ): Promise<OptimizationResult[]> {
    const output = outputFunc || console.log;
    
    // 检查设置
    const validation = optimizationSetting.isValid();
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const settings = optimizationSetting.generateSettings();
    const evaluateFunc = this.createEvaluateFunction(backtestingSetting, strategyName);
    const keyFunc = this.getTargetValueFunction(optimizationSetting.targetName);

    output('开始执行穷举算法优化');
    output(`参数优化空间：${settings.length}`);

    const startTime = Date.now();
    const results: OptimizationResult[] = [];

    // 分批处理以控制并发
    const batchSize = maxWorkers;
    for (let i = 0; i < settings.length; i += batchSize) {
      const batch = settings.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (params) => {
        const result = await evaluateFunc(params);
        const target = keyFunc(result);
        return { params, result, target };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      output(`进度：${Math.min(i + batchSize, settings.length)}/${settings.length}`);
    }

    // 按目标值排序
    results.sort((a, b) => b.target - a.target);

    const endTime = Date.now();
    const cost = Math.floor((endTime - startTime) / 1000);
    output(`穷举算法优化完成，耗时${cost}秒`);

    return results;
  }

  /**
   * 遗传算法优化
   */
  async runGeneticOptimization(
    optimizationSetting: OptimizationSetting,
    backtestingSetting: BacktestingSetting,
    strategyName: string,
    populationSize: number = 100,
    ngenSize: number = 30,
    outputFunc?: OutputFunc
  ): Promise<OptimizationResult[]> {
    const output = outputFunc || console.log;
    
    // 检查设置
    const validation = optimizationSetting.isValid();
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const evaluateFunc = this.createEvaluateFunction(backtestingSetting, strategyName);
    const keyFunc = this.getTargetValueFunction(optimizationSetting.targetName);

    const gaConfig = {
      populationSize,
      ngenSize,
      cxpb: 0.95, // 交叉概率
      mutpb: 0.05, // 变异概率
      mu: Math.floor(populationSize * 0.8) // 选择个数
    };

    const ga = new GeneticAlgorithm(optimizationSetting, evaluateFunc, keyFunc, gaConfig);
    
    return await ga.run(output);
  }
}