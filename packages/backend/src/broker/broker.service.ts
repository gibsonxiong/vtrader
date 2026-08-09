import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Broker } from '../entities/broker.entity';
import type { BrokerModel, BrokerType } from '../types/broker';

@Injectable()
export class BrokerService implements OnModuleInit {
  private readonly logger = new Logger(BrokerService.name);
  private cache: Map<string, BrokerModel> = new Map();

  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Broker)
    private readonly brokerRepo: EntityRepository<Broker>,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  async refreshCache() {
    const brokers = await this.em.find(Broker, { isActive: true });

    this.cache.clear();
    for (const b of brokers) {
      this.cache.set(b.id, {
        id: b.id,
        name: b.name,
        brokerType: b.brokerType as BrokerType,
        apiKey: b.apiKey,
        apiSecret: b.apiSecret,
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      });
    }
  }

  async getAllConfigs(decrypt = false): Promise<BrokerModel[]> {
    if (this.cache.size === 0) {
      await this.refreshCache();
    }

    return Array.from(this.cache.values()).map((c) => ({
      ...c,
      apiKey: decrypt ? c.apiKey : '***',
      apiSecret: decrypt ? c.apiSecret : '***',
    }));
  }

  async getConfig(brokerId: string, decrypt = false): Promise<BrokerModel | undefined> {
    const configs = await this.getAllConfigs(decrypt);
    return configs.find((c) => c.id === brokerId);
  }

  async getConfigByType(brokerType: BrokerType, decrypt = false): Promise<BrokerModel[]> {
    const configs = await this.getAllConfigs(decrypt);
    return configs.filter((c) => c.brokerType === brokerType);
  }

  async create(data: { name: string; brokerType: BrokerType; apiKey: string; apiSecret: string }) {
    const broker = this.em.create(Broker, {
      name: data.name,
      brokerType: data.brokerType,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(broker);
    await this.refreshCache();
    return broker;
  }

  async update(id: string, data: { name: string }) {
    const broker = await this.em.findOneOrFail(Broker, { id });
    broker.name = data.name;
    await this.em.persistAndFlush(broker);
    await this.refreshCache();
    return broker;
  }

  async remove(id: string) {
    const broker = await this.em.findOneOrFail(Broker, { id });
    broker.isActive = false;
    await this.em.persistAndFlush(broker);
    await this.refreshCache();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupDeletedBrokers() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const brokers = await this.em.find(Broker, {
      isActive: false,
      updatedAt: { $lt: sevenDaysAgo },
    });

    if (brokers.length > 0) {
      await this.em.removeAndFlush(brokers);
      this.logger.log(`已清理 ${brokers.length} 条过期 broker 数据`);
    }
  }
}
