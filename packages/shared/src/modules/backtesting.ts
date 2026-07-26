import { Interval, type BarData, type TradeData } from './common';

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
