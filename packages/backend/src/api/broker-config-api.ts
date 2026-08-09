import type { Response } from '../types/common';
import { getHttp } from './http';
import type { BrokerModel, BrokerType } from '../types/broker';

export const brokerConfigApi = {
  /** 获取所有 broker 配置（不返回密钥） */
  list() {
    return getHttp().post<Response<BrokerModel[]>>('/broker-config/list');
  },

  /** 新增 broker */
  create(data: { name: string; brokerType: BrokerType; apiKey: string; apiSecret: string }) {
    return getHttp().post<Response<BrokerModel>>('/broker-config/create', data);
  },

  /** 更新 broker（仅允许修改名称） */
  update(data: { id: string; name: string }) {
    return getHttp().post<Response<BrokerModel>>('/broker-config/update', data);
  },

  /** 删除 broker（软删除） */
  remove(data: { id: string }) {
    return getHttp().post<Response<void>>('/broker-config/remove', data);
  },
};
