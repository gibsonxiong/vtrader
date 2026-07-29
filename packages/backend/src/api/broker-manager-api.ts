import type { Response } from 'src/types/common';
import { getHttp } from './http';
import type { BrokerConfig } from 'src/types/broker';


export const brokerManagerApi = {
  getConfigs() {
    return getHttp().post<Response<BrokerConfig[]>>(
      '/broker-manager/getConfigs',
    );
  },
};
