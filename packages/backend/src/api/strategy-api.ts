import type { Response } from '../types/common';
import type { StrategyParamDTO } from '../types/strategy';
import { getHttp } from './http';

export const strategyApi = {
  getStrategyClasses() {
    return getHttp().post<Response<string[]>>(
      '/strategy/strategy_class',
    );
  },
  getStrategyDetail(params: { name: string }) {
    return getHttp().post<Response<StrategyParamDTO>>(
      '/strategy/strategy_class/detail', params,
    );
  },
};
