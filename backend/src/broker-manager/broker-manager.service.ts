import { Injectable } from '@nestjs/common';
import { Broker } from './broker';
import type { BrokerSettings } from '@vtrader/shared';
import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear/broker';
import BinanceLinearTestnetBroker from 'src/broker-manager/brokers/binance-linear-testnet/broker';

export interface BrokerConfig {
  brokers: {
    id: string;
    Class: new () => Broker;
    settings: BrokerSettings;
  }[];
}

const config: BrokerConfig = {
  brokers: [
    {
      id: '1',
      Class: BinanceLinearTestnetBroker,
      settings: {
        apiKey: 'nzadRyiGuHIrLZGHuFeMiyING98FbpZi9127Lf3I8GvMCgMcc70QqZqnVInkFJx7',
        apiSecret: 'KgyQpJrZiYkHsKl4Abj0cy6XwN12bAbxQ2jhbYNUAt6cysSpaEg4Eh7Ry1VEwsTM',
        // server: 'TESTNET',
        // klineStream: true,
        // proxyHost: '127.0.0.1',
        // proxyPort: 7890,
      },
    },
    {
      id: '2',
      Class: BinanceLinearBroker,
      settings: {
        apiKey: 'nzadRyiGuHIrLZGHuFeMiyING98FbpZi9127Lf3I8GvMCgMcc70QqZqnVInkFJx7',
        apiSecret: 'KgyQpJrZiYkHsKl4Abj0cy6XwN12bAbxQ2jhbYNUAt6cysSpaEg4Eh7Ry1VEwsTM',
        // server: 'TESTNET',
        // klineStream: true,
        // proxyHost: '127.0.0.1',
        // proxyPort: 7890,
      },
    },
  ],
};

@Injectable()
export class BrokerManagerService {
  instances: Record<string, Promise<Broker>> = {};
  // promise: Promise<Broker> | null = null;

  getBrokerConfig(): BrokerConfig {
    return config;
  }

  async getBroker(brokerId: string): Promise<Broker> {
    const brokerConfig = config.brokers.find(c => c.id === brokerId);

    if (!brokerConfig) {
      throw new Error('未找到id为[${brokerId}]的broker');
    }

    const instance = this.instances[brokerId];

    if (!instance) {
      this.instances[brokerId] = new Promise((resolve) => {
        const broker = new brokerConfig.Class();
        broker.connect(config.brokers[0].settings).then(() => {
          resolve(broker);
        });
      });
    }
    return this.instances[brokerId];
  }
}
