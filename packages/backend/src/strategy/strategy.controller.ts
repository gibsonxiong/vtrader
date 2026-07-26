import { Controller, Post, Body } from '@nestjs/common';
import { Response } from '@vtrader/shared';
import { StrategyService } from './strategy.service';
import type { ParamConfig } from './strategy';
import { response } from 'src/utils';

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

  // POST /strategy/strategy_class
  @Post('strategy_class')
  async getStrategyClasses() {
    const list = await this.strategyService.getStategieConfigs();
    return response(list.map((i) => i.name));
  }

  // POST /strategy/strategy_class/detail
  @Post('strategy_class/detail')
  async getStrategyParams(@Body() body: { name: string }) {
    const strategies = await this.strategyService.getStategieConfigs();
    const s = strategies.find((i) => i.name === body.name);
    if (!s) return response({});

    const dto: StrategyParamDTO = {};
    for (const [key, cfg] of Object.entries(s.paramConfigs)) {
      dto[key] = {
        value: cfg.default,
        type: toTypeString(cfg.type),
      };
    }
    return response(dto);
  }
}
