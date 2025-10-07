import { Controller, Get, Param } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import type { ParamConfig } from './strategy';

type StrategyParamDTO = Record<string, { value: any; type: string }>;

function toTypeString(t: ParamConfig['type']): string {
  if (t === String) return 'string';
  if (t === Number) return 'number';
  if (t === Boolean) return 'boolean';
  if (t === Array) return 'array';
  if (t === Object) return 'object';
  if (t === Function) return 'function';
  return 'unknown';
}

@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  // GET /strategy/strategy_class
  @Get('strategy_class')
  async getStrategyClasses(): Promise<string[]> {
    const list = await this.strategyService.getStategies();
    return list.map((i) => i.name);
  }

  // GET /strategy/strategy_class/:strategyName
  @Get('strategy_class/:name')
  async getStrategyParams(@Param('name') name: string): Promise<StrategyParamDTO> {
    const strategies = await this.strategyService.getStategies();
    const s = strategies.find((i) => i.name === name);
    if (!s) return {};

    const dto: StrategyParamDTO = {};
    for (const [key, cfg] of Object.entries(s.paramConfigs)) {
      dto[key] = {
        value: cfg.default,
        type: toTypeString(cfg.type),
      };
    }
    return dto;
  }
}