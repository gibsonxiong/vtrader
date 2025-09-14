import { Controller, Get, Param, Post, Body } from '@nestjs/common';

import { BacktestingService } from './backtesting.service';
import { StrategyService } from './strategy.service';

@Controller('backtesting')
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
    private readonly strategyService: StrategyService,
  ) {}

  /**
   * 获取所有策略列表
   */
  @Get('strategy_class')
  async getStrategyList(): Promise<string[]> {
    const strategies = await this.strategyService.getStategies();
    return strategies.map(strategy => strategy.name);
  }

  /**
   * 获取指定策略的参数配置
   */
  @Get('strategy_class/:strategyName')
  async getStrategyParams(@Param('strategyName') strategyName: string): Promise<Record<string, any>> {
    const strategies = await this.strategyService.getStategies();
    const strategy = strategies.find(s => s.name === strategyName);
    
    if (!strategy) {
      return {};
    }

    // 转换参数配置格式，添加默认值
    const params: Record<string, any> = {};
    Object.entries(strategy.paramConfigs).forEach(([key, config]) => {
      params[key] = {
        value: config.default,
        type: config.type.name.toLowerCase()
      };
    });

    return params;
  }

  /**
   * 开始回测
   */
  @Post('start')
  async startBacktest(@Body() backtestData: any): Promise<any> {
    try {
      // 这里可以添加回测逻辑
      console.log('收到回测请求:', backtestData);
      return { success: true, message: '回测请求已接收' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
