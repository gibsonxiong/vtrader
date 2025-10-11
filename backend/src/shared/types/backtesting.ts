import { Interval } from './common';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  startDate: string;
  endDate: string;
  symbols: string | string[];
  interval: Interval;
  balance: number;
  assetName?: string;
  commissionRate: number;
  strategy: {
    strategyName: string;
    strategySetting?: Record<string, any>;
  };
}

export interface BacktestingResult {
  startDate: string;
  endDate: string;
  startBalance: number;
  endBalance: number;
  totalNetPnl: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
}
