import { tradeRequestClient } from '#/api/request';

export namespace StrategyApi {
  /** 策略类信息 */
  export interface StrategyClass {
    name: string;
    parameters: Record<string, any>;
    [key: string]: any;
  }

  /** 策略参数 */
  export interface StrategyParams {
    [key: string]: any;
  }
}

/**
 * 获取所有策略类
 */
export async function getStrategyClassesApi() {
  return tradeRequestClient.get<string[]>('/strategy/strategy_class');
}

/**
 * 根据策略名称获取策略类详情
 */
export async function getStrategyClassByNameApi(strategyName: string) {
  return tradeRequestClient.get<StrategyApi.StrategyClass>(`/strategy/strategy_class/${strategyName}`);
}
