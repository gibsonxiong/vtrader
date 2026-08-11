import { Interval, type BarData, type TradeData } from './common';
import type { BrokerType } from './broker';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  brokerType: BrokerType;
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
  dataLoader?: (symbol: string, interval: Interval, preloadCount: number) => AsyncGenerator<BarData>;
}

export interface DailyResultItem {
  date: string;
  trades: TradeData[];
  netPnl: number;
  accumNetPnl: number;
}

export interface BacktestingResult {
  brokerType: BrokerType;
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
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  annualizedReturn: number;
  maxConsecutiveLosses: number;
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

export interface BacktestingModel {
  id: number;
  brokerId: string;
  strategyName: string;
  symbol: string;
  interval: string;
  startDate: string;
  endDate: string;
  startBalance: string;
  endBalance: string;
  maxDrawdown: string;
  maxDrawdownPercent: string;
  totalNetPnl: string;
  totalReturnPercent: string;
  dailyResults: object;
  trades: TradeData[];
  createdAt: Date;
}

export interface JobStatusResult {
  status: string;
  progress: number;
  data?: {
    backtesting: BacktestingModel;
  };
  failedReason: string;
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
    model: BacktestingModel | null;
  }

  export interface QueryManyRequest {
    where?: Record<string, any>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, any>;
  }

  export interface QueryManyResponse {
    models: BacktestingModel[];
    total: number;
  }

  export interface RemoveRequest {
    id: number;
  }

  export interface RemoveResponse {}

  export interface JobStatusRequest {
    jobId: string;
  }
}
