import type { Response } from 'src/types/common';
import { getHttp } from './http';
import type { BarData, ContractData } from 'src/types/common';
import type { GetContractsParams, GetBarsParams, DownloadParams, SyncContractsParams } from 'src/types/market-data';

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
    return getHttp().post<Response<BarData[]>>(
      '/market-data/getBars', params,
    );
  },
  download(params: DownloadParams) {
    return getHttp().post<Response<{ jobId: string; message: string }>>(
      '/market-data/download', params,
    );
  },
  syncContracts(params: SyncContractsParams) {
    return getHttp().post<Response<{ count: number }>>(
      '/market-data/syncContracts', params,
    );
  },
};
