import type { Response } from 'src/types/common';
import { Controller, Post, Body } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import type { ParamConfig, StrategyParamDTO } from '../types/strategy';
import { response } from 'src/utils';
import { StrategyDetailDto } from './dto/strategy.dto';

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
  async getStrategyClasses(): Promise<Response<string[]>> {
    const list = await this.strategyService.getStategieConfigs();
    return response(list.map((i) => i.name));
  }

  // POST /strategy/strategy_class/detail
  @Post('strategy_class/detail')
  async getStrategyParams(@Body() body: StrategyDetailDto): Promise<Response<StrategyParamDTO>> {
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
