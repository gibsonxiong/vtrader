import { tradeRequestClient } from '#/api/request';

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

  /** K线数据 */
  export interface BarData {
    symbol: string;
    exchange: string;
    datetime: string;
    interval: string;
    volume: number;
    turnover: number;
    open_interest: number;
    open_price: number;
    high_price: number;
    low_price: number;
    close_price: number;
    [key: string]: any;
  }

  /** K线查询参数 */
  export interface BarQueryParams {
    symbol: string;
    interval: string;
    start?: string;
    end?: string;
    [key: string]: any;
  }

  /** 数据下载参数 */
  export interface DownloadParams {
    symbol: string;
    interval: string;
    start: string;
    end?: string;
    [key: string]: any;
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
  return tradeRequestClient.get<MarketDataApi.ContractData[]>('/market-data/contracts');
}

/**
 * 获取K线数据
 */
export async function getBarsApi(params: MarketDataApi.BarQueryParams) {
  return tradeRequestClient.get<MarketDataApi.BarData[]>('/market-data/bars', { params });
}

/**
 * 下载历史数据
 */
export async function downloadBarsApi(params: MarketDataApi.DownloadParams) {
  return tradeRequestClient.post<MarketDataApi.DownloadResponse>('/market-data/download', params);
}
