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
  instance: Broker;
  promise: Promise<Broker> | null = null;

  async getBroker(): Promise<Broker> {
    if (this.instance) {
      return this.instance;
    } else {
      if (!this.promise) {
        this.promise = new Promise((resolve) => {
          const broker = new config.brokers[0].Class();
          broker.connect(config.brokers[0].settings).then(() => {
            this.promise = null;
            this.instance = broker;
            resolve(broker);
          });
        });
      }
      return this.promise;
    }
  }
}
