import { Injectable } from '@nestjs/common';
import { Broker, type BrokerName } from './broker';
import type { BrokerSettings } from '@vtrader/shared';
import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear/broker';
import BinanceLinearTestnetBroker from 'src/broker-manager/brokers/binance-linear-testnet/broker';
import config from 'src/config';
import { MockBroker, MockBrokerProps } from './brokers/mock/mock-broker';

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
      console.log('生成broker中');
      
      this.instances[brokerId] = new Promise((resolve) => {
        const broker = new brokerClass();
        broker.connect(brokerConfig.settings).then(() => {
          resolve(broker);
        });
      });
    }
    return this.instances[brokerId];
  }

  async createMockBroker(props: MockBrokerProps): Promise<MockBroker> {
    const { brokerId } = props;
    const brokerConfig = this.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const brokerClass = this.brokerClassMap[brokerConfig.brokerName];

    if (!brokerClass) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    console.log('生成mock broker中');
    
    const broker = new brokerClass();
    const mockBroker = new MockBroker(props);

    return mockBroker;
  }
}
