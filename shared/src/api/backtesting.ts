import { BacktestingSetting } from '../modules/backtesting';
import { Backtesting, Prisma } from '../../generated/client';

export namespace BacktestingApi {
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
  
  export interface QueryManyRequest extends Prisma.BacktestingFindManyArgs {}
  
  export interface QueryManyResponse {
    models: Backtesting[];
    total: number;
  }
  
  export interface RemoveRequest {
    id: number;
  }
  
  export interface RemoveResponse {
  }
}

