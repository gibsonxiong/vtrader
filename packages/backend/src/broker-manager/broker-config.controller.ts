import { Controller, Post, Body } from '@nestjs/common';
import { BrokerConfigService } from './broker-config.service';
import type { Response } from '../types/common';
import type { BrokerType } from '../types/broker';

@Controller('broker-config')
export class BrokerConfigController {
  constructor(private readonly configService: BrokerConfigService) {}

  // 获取列表（不返回密钥）
  @Post('list')
  async list(): Promise<Response<any[]>> {
    const configs = this.configService.getAllConfigs();
    return { code: 0, msg: 'success', data: configs };
  }

  // 新增
  @Post('create')
  async create(@Body() body: {
    name: string;
    brokerType: BrokerType;
    apiKey: string;
    apiSecret: string;
    settings?: Record<string, any>;
  }): Promise<Response<any>> {
    const broker = await this.configService.create(body);
    return { code: 0, msg: 'success', data: broker };
  }

  // 更新
  @Post('update')
  async update(@Body() body: {
    id: string;
    name?: string;
    apiKey?: string;
    apiSecret?: string;
    settings?: Record<string, any>;
  }): Promise<Response<any>> {
    const { id, ...data } = body;
    const broker = await this.configService.update(id, data);
    return { code: 0, msg: 'success', data: broker };
  }

  // 删除
  @Post('remove')
  async remove(@Body() body: { id: string }): Promise<Response<void>> {
    await this.configService.remove(body.id);
    return { code: 0, msg: 'success', data: undefined };
  }
}
