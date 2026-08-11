import type { Response } from '../types/common';
import { Controller, Post, Body } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import type { ParamConfig, StrategyParamDTO } from '../types/strategy';
import { response } from '../utils';
import { StrategyDetailDto } from './dto/strategy.dto';

function toTypeString(t: ParamConfig['type']): string {
  if (t === String) return 'string';
  if (t === Number) return 'number';
  if (t === Boolean) return 'boolean';
  return 'unknown';
}

@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  // POST /strategy/strategy_class
  @Post('strategy_class')
  async getStrategyClasses(): Promise<Response<string[]>> {
    const list = await this.strategyService.getStrategyConfigs();
    return response(list.map((i) => i.name));
  }

  // POST /strategy/strategy_class/detail
  @Post('strategy_class/detail')
  async getStrategyParams(@Body() body: StrategyDetailDto): Promise<Response<StrategyParamDTO>> {
    const strategies = await this.strategyService.getStrategyConfigs();
    const s = strategies.find((i) => i.name === body.name);
    if (!s) return response({});

    const dto: StrategyParamDTO = {};
    for (const [key, cfg] of Object.entries(s.strategyClass.getParamConfigs())) {
      dto[key] = {
        value: cfg.default,
        type: toTypeString(cfg.type),
      };
    }
    return response(dto);
  }
}
