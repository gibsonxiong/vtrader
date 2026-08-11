import type { Response } from '../types/common';
import { getHttp } from './http';
import type { BacktestingApi, JobStatusResult, OptimizerSetting } from '../types/backtesting';

export const backtestingApi = {
  create(params: BacktestingApi.CreateRequest) {
    return getHttp().post<Response<BacktestingApi.CreateResponse>>(
      '/backtesting/create', params,
    );
  },
  optimization(params: OptimizerSetting) {
    return getHttp().post<Response<{ jobId: string; message: string }>>(
      '/backtesting/optimization', params,
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
    return getHttp().post<Response<JobStatusResult>>(
      '/backtesting/job/status', params,
    );
  },
};
