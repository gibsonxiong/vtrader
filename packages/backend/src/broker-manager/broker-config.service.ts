import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { encrypt, decrypt } from '../utils/crypto';
import type { BrokerConfig, BrokerSettings, BrokerType } from '../types/broker';

@Injectable()
export class BrokerConfigService implements OnModuleInit {
  private readonly logger = new Logger(BrokerConfigService.name);
  private cache: Map<string, BrokerConfig> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  // 刷新缓存
  async refreshCache() {
    const brokers = await this.prisma.broker.findMany({
      where: { isActive: true },
    });
    
    this.cache.clear();
    for (const b of brokers) {
      let apiKey, apiSecret;
      try {
        apiKey = decrypt(b.apiKey);
        apiSecret = decrypt(b.apiSecret);
      } catch (error) {
        this.logger.error(`Error decrypting broker ${b.id}: ${error}`);
        apiKey = '';
        apiSecret = '';
      }
      this.cache.set(b.id, {
        id: b.id,
        name: b.name,
        brokerType: b.brokerType as BrokerType,
        apiKey,
        apiSecret,
      });
    }
  }

  // 获取所有配置（不返回密钥）
  async getAllConfigs(decrypt = false): Promise<BrokerConfig[]> {
    if (this.cache.size === 0) {
      await this.refreshCache();
    }

    return Array.from(this.cache.values()).map(c => ({
      ...c,
      apiKey: decrypt ? c.apiKey : '***',
      apiSecret: decrypt ? c.apiSecret : '***',
    }));
  }

  // 获取完整配置（含密钥，仅内部使用）
  async getConfig(brokerId: string, decrypt = false): Promise<BrokerConfig | undefined> {
    const configs = await this.getAllConfigs(decrypt);
    return configs.find(c => c.id === brokerId);
  }

  async getConfigByType(brokerType: BrokerType, decrypt = false): Promise<BrokerConfig[]> {
    const configs = await this.getAllConfigs(decrypt);
    return configs.filter(c => c.brokerType === brokerType);
  }

  // 新增 broker
  async create(data: {
    name: string;
    brokerType: BrokerType;
    apiKey: string;
    apiSecret: string;
  }) {
    const broker = await this.prisma.broker.create({
      data: {
        name: data.name,
        brokerType: data.brokerType,
        apiKey: encrypt(data.apiKey),
        apiSecret: encrypt(data.apiSecret),
      },
    });
    await this.refreshCache();
    return broker;
  }

  // 更新 broker（仅允许修改名称）
  async update(id: string, data: { name: string }) {
    const broker = await this.prisma.broker.update({
      where: { id },
      data: { name: data.name },
    });
    await this.refreshCache();
    return broker;
  }

  // 删除 broker（软删除）
  async remove(id: string) {
    await this.prisma.broker.update({
      where: { id },
      data: { isActive: false },
    });
    await this.refreshCache();
  }

  // 每天凌晨 3 点清理超过 7 天的软删除数据
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupDeletedBrokers() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.broker.deleteMany({
      where: {
        isActive: false,
        updatedAt: { lt: sevenDaysAgo },
      },
    });

    if (result.count > 0) {
      this.logger.log(`已清理 ${result.count} 条过期 broker 数据`);
    }
  }
}
