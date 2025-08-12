import { Controller, Post, Body } from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OptimizationSetting } from './optimization-setting';
import { BacktestingSetting } from '../backtesting.service';
import { OptimizationResult } from './types';

export interface OptimizationRequest {
  backtestingSetting: BacktestingSetting;
  strategyName: string;
  parameters: {
    name: string;
    start?: number;
    end?: number;
    step?: number;
    values?: any[];
  }[];
  targetName: string;
  algorithm: 'brute_force' | 'genetic';
  maxWorkers?: number;
  populationSize?: number;
  ngenSize?: number;
}

@Controller('optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Post('run')
  async runOptimization(@Body() request: OptimizationRequest): Promise<{
    success: boolean;
    results?: OptimizationResult[];
    message?: string;
  }> {
    try {
      // 创建优化设置
      const optimizationSetting = new OptimizationSetting();
      optimizationSetting.setTarget(request.targetName);

      // 添加参数
      for (const param of request.parameters) {
        if (param.values) {
          // 离散参数
          optimizationSetting.addDiscreteParameter(param.name, param.values);
        } else if (param.start !== undefined && param.end !== undefined && param.step !== undefined) {
          // 范围参数
          const result = optimizationSetting.addParameter(param.name, param.start, param.end, param.step);
          if (!result.success) {
            return { success: false, message: result.message };
          }
        } else if (param.start !== undefined) {
          // 固定参数
          const result = optimizationSetting.addParameter(param.name, param.start);
          if (!result.success) {
            return { success: false, message: result.message };
          }
        } else {
          return { success: false, message: `参数 ${param.name} 配置无效` };
        }
      }

      // 执行优化
      let results: OptimizationResult[];

      if (request.algorithm === 'genetic') {
        results = await this.optimizationService.runGeneticOptimization(
          optimizationSetting,
          request.backtestingSetting,
          request.strategyName,
          request.populationSize || 100,
          request.ngenSize || 30
        );
      } else {
        results = await this.optimizationService.runBruteForceOptimization(
          optimizationSetting,
          request.backtestingSetting,
          request.strategyName,
          request.maxWorkers || 4
        );
      }

      return { success: true, results };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '优化过程发生未知错误' 
      };
    }
  }
}