import { tradeRequestClient } from '#/api/request';
import type { BarData } from '@vtrader/shared';

export namespace MarketDataApi {
  /** 合约数据 */
  export interface ContractData {
    symbol: string;
    name: string;
    exchange: string;
    product: string;
    size: number;
    pricetick: number;
    min_volume: number;
    stop_supported: boolean;
    net_position: boolean;
    history_data: boolean;
    [key: string]: any;
  }

  /** K线查询参数 */
  export interface BarQueryParams {
    symbol: string;
    interval: string;
    startDate?: string;
    endDate?: string;
    source: 'broker' | 'db';
  }

  /** 数据下载参数 */
  export interface DownloadParams {
    symbol: string;
    interval: string;
    startDate: string;
    endDate?: string;
  }

  /** 下载响应 */
  export interface DownloadResponse {
    count: number;
    message?: string;
  }
}

/**
 * 获取所有合约列表
 */
export async function getContractsApi() {
  return tradeRequestClient.post<MarketDataApi.ContractData[]>('/market-data/getContracts');
}

/**
 * 获取K线数据
 */
export async function getBarsApi(params: MarketDataApi.BarQueryParams) {
  return tradeRequestClient.post<BarData[]>('/market-data/getBars', params);
}

/**
 * 下载历史数据
 */
export async function downloadBarsApi(params: MarketDataApi.DownloadParams) {
  return tradeRequestClient.post<MarketDataApi.DownloadResponse>('/market-data/download', params);
}
