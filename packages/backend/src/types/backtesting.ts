import { Interval, type BarData, type TradeData } from './common';
import { Backtesting, Prisma } from '../../generated/client';

export type { Backtesting } from '../../generated/client';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  brokerId: string;
  startDate: string;
  endDate: string;
  symbol: string; // 多个用逗号分隔
  interval: Interval;
  commissionRate: number;
  assetBalance: number;
  assetName: string;
  strategyName: string;
  strategySetting?: Record<string, any>;
  data?: BarData[];
  dataLoader?: (symbol: string, interval: Interval, preloadCount: number) => Promise<BarData[]>;
}

export interface DailyResultItem {
  date: string;
  trades: TradeData[];
  netPnl: number;
  accumNetPnl: number;
}

export interface BacktestingResult {
  brokerId: string;
  symbol: string;
  strategyName: string;
  interval: Interval;
  startDate: string;
  endDate: string;
  startBalance: number;
  endBalance: number;
  totalNetPnl: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  dailyResults: DailyResultItem[];
  trades: TradeData[];
}

export interface Hyperparameter {
  min: number;
  max: number;
  step: number;
  type: 'int' | 'float' | 'category';
  category?: any[];
}

export type OptimizerSetting = Omit<BacktestingSetting, 'strategySetting'> & {
  hyperparameters: { name: string; type: 'continuous' | 'categorical'; range: number[] | string[] }[];
  maxTrials: number;
  direction: 'maximize' | 'minimize';
  earlyStoppingRounds?: number;
};

export interface OptimizerConfig {
  hyperparameters: {
    name: string;
    type: 'continuous' | 'categorical';
    range: number[] | string[];
  }[];
  trainModel: (hyperparameters: Record<string, any>) => Promise<number>;
  maxTrials: number;
  direction: 'maximize' | 'minimize';
  earlyStoppingRounds?: number;
}

export interface TrialResult {
  id: number;
  hyperparameters: Record<string, any>;
  score: number;
}

export namespace BacktestingApi {
  export interface CreateRequest extends BacktestingSetting {}

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

  export interface RemoveResponse {}

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
