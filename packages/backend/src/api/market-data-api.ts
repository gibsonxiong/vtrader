import type { Response } from 'src/types/common';
import { getHttp } from './http';
import type { BarData, ContractData } from 'src/types/common';
import type { GetContractsParams, GetBarsParams, DownloadParams, BatchDownloadBarsParams, SyncContractsParams } from 'src/types/market-data';

/**
 * 下载任务状态
 */
export interface DownloadJobStatus {
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'not_found';
  progress?: number;
  data?: any;
  result?: {
    totalBars?: number;
    message?: string;
    results?: Array<{
      symbol: string;
      interval: string;
      totalBars: number;
    }>;
  };
  failedReason?: string;
  message?: string;
}

export const marketDataApi = {
  getBarOverviews() {
    return getHttp().post<Response<any[]>>(
      '/market-data/getBarOverviews',
    );
  },
  getContracts(params: GetContractsParams) {
    return getHttp().post<Response<ContractData[]>>(
      '/market-data/getContracts', params,
    );
  },
  getBars(params: GetBarsParams) {
    return getHttp().post<Response<{
    list: BarData[];
    total: number;
  }>>(
      '/market-data/getBars', params,
    );
  },
  download(params: DownloadParams) {
    return getHttp().post<Response<{ jobId: string; message: string }>>(
      '/market-data/download', params,
    );
  },
  batchDownload(params: BatchDownloadBarsParams) {
    return getHttp().post<Response<{ jobId: string; message: string }>>(
      '/market-data/batchDownload', params,
    );
  },
  getDownloadStatus(jobId: string) {
    return getHttp().post<Response<DownloadJobStatus>>(
      '/market-data/download/status', { jobId },
    );
  },
  syncContracts(params: SyncContractsParams) {
    return getHttp().post<Response<{ count: number }>>(
      '/market-data/syncContracts', params,
    );
  },
};
