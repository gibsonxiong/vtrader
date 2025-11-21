import { Injectable } from '@nestjs/common';
import { Broker, type BrokerName } from './broker';
import type { BrokerSettings } from '@vtrader/shared';
import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear/broker';
import BinanceLinearTestnetBroker from 'src/broker-manager/brokers/binance-linear-testnet/broker';
import config from 'src/config';

export interface BrokerConfig {
  id: string;
  brokerName: string;
  settings: BrokerSettings;
}

@Injectable()
export class BrokerManagerService {
  brokerClassMap: Record<string, new () => Broker> = {};
  instances: Record<string, Promise<Broker>> = {};

  constructor() {
    this.registerBroker('BINANCE_LINEAR_BROKER', BinanceLinearBroker);
    this.registerBroker('BINANCE_LINEAR_TESTNET_BROKER', BinanceLinearTestnetBroker);
  }

  registerBroker(brokerName: BrokerName, BrokerClass: new () => Broker) {
    this.brokerClassMap[brokerName] = BrokerClass;
  }

  getBrokerConfigs(): BrokerConfig[] {
    return config.brokers;
  }

  getBrokerConfig(brokerId: string): BrokerConfig | undefined {
    return this.getBrokerConfigs().find(c => c.id === brokerId);
  }

  async getBroker(brokerId: string): Promise<Broker> {
    const brokerConfig = this.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const brokerClass = this.brokerClassMap[brokerConfig.brokerName];

    if (!brokerClass) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const instance = this.instances[brokerId];

    if (!instance) {
      this.instances[brokerId] = new Promise((resolve) => {
        const broker = new brokerClass();
        broker.connect(brokerConfig.settings).then(() => {
          resolve(broker);
        });
      });
    }
    return this.instances[brokerId];
  }
}
