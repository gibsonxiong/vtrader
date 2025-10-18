import { BacktestingSetting, BacktestingResult } from '@vtrader/shared';
import type { Prisma, Backtesting } from 'src/generated/client/index';

export interface CreateRequest extends BacktestingSetting {
}

export interface CreateResponse {
  id: number;
}

export interface QueryRequest {
  id: number;
}

export interface QueryResponse {
  model: Backtesting | null;
}

export interface QueryManyRequest extends Prisma.BacktestingFindManyArgs {
}

export interface QueryManyResponse {
  models: Backtesting[];
}
