import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { encrypt, decrypt } from '../utils/crypto';
import type { BrokerConfig, BrokerSettings, BrokerType } from '../types/broker';

@Injectable()
export class BrokerConfigService implements OnModuleInit {
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
      this.cache.set(b.id, {
        id: b.id,
        name: b.name,
        brokerType: b.brokerType as BrokerType,
        settings: {
          ...this.decryptSettings(b.apiKey, b.apiSecret),
          ...(b.settings as Record<string, any> || {}),
        },
      });
    }
  }

  // 解密 settings
  private decryptSettings(apiKey: string, apiSecret: string): BrokerSettings {
    return {
      apiKey: decrypt(apiKey),
      apiSecret: decrypt(apiSecret),
    };
  }

  // 获取所有配置（不返回密钥）
  getAllConfigs(): BrokerConfig[] {
    return Array.from(this.cache.values()).map(c => ({
      ...c,
      settings: { apiKey: '***', apiSecret: '***' } as any,
    }));
  }

  // 获取完整配置（含密钥，仅内部使用）
  getFullConfig(brokerId: string): BrokerConfig | undefined {
    return this.cache.get(brokerId);
  }

  // 新增 broker
  async create(data: {
    name: string;
    brokerType: BrokerType;
    apiKey: string;
    apiSecret: string;
    settings?: Record<string, any>;
  }) {
    const broker = await this.prisma.broker.create({
      data: {
        name: data.name,
        brokerType: data.brokerType,
        apiKey: encrypt(data.apiKey),
        apiSecret: encrypt(data.apiSecret),
        settings: data.settings || {},
      },
    });
    await this.refreshCache();
    return broker;
  }

  // 更新 broker
  async update(id: string, data: {
    name?: string;
    apiKey?: string;
    apiSecret?: string;
    settings?: Record<string, any>;
  }) {
    const updateData: any = { ...data };
    if (data.apiKey) updateData.apiKey = encrypt(data.apiKey);
    if (data.apiSecret) updateData.apiSecret = encrypt(data.apiSecret);
    
    const broker = await this.prisma.broker.update({
      where: { id },
      data: updateData,
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
}
