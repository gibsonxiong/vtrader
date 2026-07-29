import type { Response } from 'src/types/common';
import { getHttp } from './http';
import type { BacktestingApi } from 'src/types/backtesting';

export const backtestingApi = {
  create(params: BacktestingApi.CreateRequest) {
    return getHttp().post<Response<BacktestingApi.CreateResponse>>(
      '/backtesting/create', params,
    );
  },
  query(params: BacktestingApi.QueryRequest) {
    return getHttp().post<Response<BacktestingApi.QueryResponse>>(
      '/backtesting/query', params,
    );
  },
  queryMany(params: BacktestingApi.QueryManyRequest) {
    return getHttp().post<Response<BacktestingApi.QueryManyResponse>>(
      '/backtesting/queryMany', params,
    );
  },
  remove(params: BacktestingApi.RemoveRequest) {
    return getHttp().post<Response<BacktestingApi.RemoveResponse>>(
      '/backtesting/remove', params,
    );
  },
  jobStatus(params: BacktestingApi.JobStatusRequest) {
    return getHttp().post<Response<BacktestingApi.JobStatusResponse>>(
      '/backtesting/job/status', params,
    );
  },
};
