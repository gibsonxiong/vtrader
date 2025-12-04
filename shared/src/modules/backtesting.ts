import { Interval, type TradeData } from './common';

/**
 * 回测设置接口
 */
export interface BacktestingSetting {
  brokerId: string;
  startDate: string;
  endDate: string;
  symbols: string | string[];
  interval: Interval;
  balance: number;
  commissionRate: number;
  assetName?: string;
  strategy: {
    strategyName: string;
    strategySetting?: Record<string, any>;
  };
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
  dailyResults: Record<string, DailyResultItem>;
  trades: TradeData[];
}
