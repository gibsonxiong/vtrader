import { Injectable } from '@nestjs/common';
import { Broker, type BrokerType } from './broker';
import type { BrokerSettings } from '@vtrader/shared';
import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear';
import BinanceLinearTestnetBroker from 'src/broker-manager/brokers/binance-linear-testnet';
import config from 'src/config';
import { MockBroker, MockBrokerProps } from './brokers/mock/mock-broker';

export interface BrokerConfig {
  id: string;
  brokerType: BrokerType;
  settings: BrokerSettings;
}

@Injectable()
export class BrokerManagerService {
  brokerClassMap: Record<BrokerType, new () => Broker> = {
    BINANCE_LINEAR: BinanceLinearBroker,
    BINANCE_LINEAR_TESTNET: BinanceLinearTestnetBroker,
  };
  instances: Record<string, Promise<Broker>> = {};

  constructor() {
  }

  getBrokerTypes(): BrokerType[] {
    return Object.keys(this.brokerClassMap) as BrokerType[];
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

    const brokerClass = this.brokerClassMap[brokerConfig.brokerType];

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

  async getBrokerByType(brokerType: BrokerType): Promise<Broker> {
    const brokerConfig = this.getBrokerConfigs().find(c => c.brokerType === brokerType);

    if (!brokerConfig) {
      throw new Error(`未找到类型为[${brokerType}]的broker`);
    }

    return this.getBroker(brokerConfig.id);
  }

  async createMockBroker(props: MockBrokerProps): Promise<MockBroker> {
    const { brokerId } = props;
    const brokerConfig = this.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const brokerClass = this.brokerClassMap[brokerConfig.brokerType];

    if (!brokerClass) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    console.log('生成mock broker中');
    
    const broker = new brokerClass();
    const mockBroker = new MockBroker(props);

    return mockBroker;
  }
}
