import { BacktestingSetting } from '../modules/backtesting';
import { Backtesting, Prisma } from '../../generated/client';

export namespace BacktestingApi {
  export interface CreateRequest extends BacktestingSetting {
  }
  
  export interface CreateResponse {
    jobId: string;
    message: string;
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

  // 新增：任务状态查询相关类型
  export interface JobStatusRequest {
    jobId: string;
  }

  export interface JobStatusResponse {
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress?: number;
    result?: {
      id: number;
    };
    error?: string;
  }
}

