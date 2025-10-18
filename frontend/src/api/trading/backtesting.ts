import { tradeRequestClient } from '#/api/request';
import type { BacktestingSetting } from '@vtrader/shared';

export namespace BacktestingApi {
  /** 创建回测响应 */
  export interface CreateBacktestResponse {
    code: number;
    msg: string;
    data: {
      id: number;
    }
  }

  /** 回测结果响应 */
  export interface BacktestResultResponse {
    code: number;
    msg: string;
    data: {
      model: any; // Backtesting model from backend
    }
  }

  /** 回测查询参数 */
  export interface BacktestQueryParams {
    page?: number;
    limit?: number;
    strategy_name?: string;
    symbol?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  }

  /** 回测历史响应 */
  export interface BacktestHistoryResponse {
    code: number;
    msg: string;
    data: {
      models: any[]; // Backtesting models from backend
    }
  }
}

/**
 * 创建回测任务
 */
export async function createBacktestApi(params: BacktestingSetting) {
  return tradeRequestClient.post<BacktestingApi.CreateBacktestResponse>('/backtesting/create', params);
}

/**
 * 根据ID获取回测结果
 */
export async function getBacktestResultApi(resultId: string) {
  return tradeRequestClient.post<BacktestingApi.BacktestResultResponse>('/backtesting/query', {
    id: parseInt(resultId)
  });
}

/**
 * 获取回测历史列表
 */
export async function getBacktestHistoryApi(params?: BacktestingApi.BacktestQueryParams) {
  return tradeRequestClient.post<BacktestingApi.BacktestHistoryResponse>('/backtesting/queryMany', params || {});
}
