import { Injectable } from '@nestjs/common';
import { Broker } from './broker';
import type { GatewaySettings } from 'src/types/broker';
import BinanceLinearBroker from 'src/broker-manager/brokers/binance-linear';

export interface BrokerConfig {
  brokers: {
    id: string;
    Class: new () => Broker;
    settings: GatewaySettings;
  }[];
}

const config: BrokerConfig = {
  brokers: [
    {
      id: '1',
      Class: BinanceLinearBroker,
      settings: {
        apiKey: '1c5f9a2a4faefc20b1c0667cecef2ce8998f68133540b1c87a72886d6d3adac6',
        apiSecret: '3ca3aa8dd892bdecd473fa419fc50658826ff5a864c52956ad670652416a26de',
        server: 'TESTNET',
        klineStream: true,
        proxyHost: '127.0.0.1',
        proxyPort: 7890,
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
