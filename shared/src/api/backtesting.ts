import { BacktestingSetting, BacktestingResult } from '../modules/backtesting';

export interface CreateRequest extends BacktestingSetting {
}

export interface CreateResponse {
  id: number;
}

export interface QueryRequest {
  id: number;
}

export interface QueryResponse {
  model: any | null;
}

export interface QueryManyRequest {
  skip?: number;
  take?: number;
  where?: any;
  orderBy?: any;
}

export interface QueryManyResponse {
  models: any[];
}
