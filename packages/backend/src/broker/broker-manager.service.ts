import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Broker } from './broker';
import { BrokerService } from './broker.service';
import type { BrokerType, MockBrokerProps } from '../types/broker';
import BinanceLinearBroker from './brokers/binance-linear';
import BinanceLinearTestnetBroker from './brokers/binance-linear-testnet';
import { MockBroker } from './brokers/mock/mock-broker';

@Injectable()
export class BrokerManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(BrokerManagerService.name);

  private brokerClassMap: Record<BrokerType, new () => Broker> = {
    BINANCE_LINEAR: BinanceLinearBroker,
    BINANCE_LINEAR_TESTNET: BinanceLinearTestnetBroker,
  };

  private instances: Record<string, Promise<Broker>> = {};

  constructor(private readonly brokerService: BrokerService) {}

  async getBroker(brokerId: string): Promise<Broker> {
    const brokerConfig = await this.brokerService.getConfig(brokerId, true);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const brokerClass = this.brokerClassMap[brokerConfig.brokerType];

    if (!brokerClass) {
      throw new Error(`未找到类型为[${brokerConfig.brokerType}]的broker`);
    }

    if (!this.instances[brokerId]) {
      const broker = new brokerClass();
      broker.setCredentials({
        apiKey: brokerConfig.apiKey,
        apiSecret: brokerConfig.apiSecret,
      });
      this.instances[brokerId] = Promise.resolve(broker);
    }

    return this.instances[brokerId];
  }

  async getBrokerByType(brokerType: BrokerType): Promise<Broker> {
    const brokerConfig = await this.brokerService.getConfigByType(brokerType, true);

    if (!brokerConfig.length) {
      throw new Error(`未找到类型为[${brokerType}]的broker`);
    }

    return this.getBroker(brokerConfig[0].id);
  }

  async createMockBroker(props: MockBrokerProps): Promise<MockBroker> {

    const mockBroker = new MockBroker(props);
    return mockBroker;
  }

  async destroyBroker(brokerId: string): Promise<void> {
    const instance = this.instances[brokerId];
    if (instance) {
      const broker = await instance;
      await broker.stop();
      delete this.instances[brokerId];
      this.logger.log(`Broker[${brokerId}] 已销毁`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    const brokerIds = Object.keys(this.instances);
    await Promise.all(brokerIds.map(id => this.destroyBroker(id)));
  }
}
