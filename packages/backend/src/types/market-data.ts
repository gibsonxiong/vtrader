import type { Interval } from './common';
import type { BrokerType } from './broker';

export interface GetContractsParams {
  brokerType: string;
}

export interface GetAllContractsParams {
  brokerType: BrokerType;
}

export interface GetBarsParams {
  brokerId: string;
  interval: Interval;
  startDate: string;
  endDate?: string;
  symbol: string;
  preload?: number;
  source: 'broker' | 'db';
  currentPage?: number;
  pageSize?: number;
}

export interface DownloadParams {
  brokerId: string;
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate?: string;
}

export interface BatchDownloadBarsParams {
  brokerId: string;
  symbols: string[];
  intervals: Interval[];
  startDate: string;
  endDate?: string;
}

export interface DeleteBarOverviewParams {
  brokerName: string;
  symbol: string;
  interval: Interval;
}

export interface BarOverviewRecord {
  version: 1;
  brokerType: string;
  symbol: string;
  interval: Interval;
  ranges: [string, string][];
  updatedAt: string;
  count?: number;
}


