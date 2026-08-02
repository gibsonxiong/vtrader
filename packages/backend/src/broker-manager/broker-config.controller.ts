import { Controller, Post, Body } from '@nestjs/common';
import { BrokerConfigService } from './broker-config.service';
import { response } from 'src/utils';
import type { BrokerType } from '../types/broker';

@Controller('broker-config')
export class BrokerConfigController {
  constructor(private readonly configService: BrokerConfigService) {}

  // 获取列表（不返回密钥）
  @Post('list')
  async list() {
    const configs = await this.configService.getAllConfigs();
    return response(configs);
  }

  // 新增
  @Post('create')
  async create(@Body() body: {
    name: string;
    brokerType: BrokerType;
    apiKey: string;
    apiSecret: string;
    settings?: Record<string, any>;
  }) {
    const broker = await this.configService.create(body);
    return response(broker);
  }

  // 更新（仅允许修改名称）
  @Post('update')
  async update(@Body() body: {
    id: string;
    name: string;
  }) {
    const broker = await this.configService.update(body.id, { name: body.name });
    return response(broker);
  }

  // 删除
  @Post('remove')
  async remove(@Body() body: { id: string }) {
    await this.configService.remove(body.id);
    return response();
  }
}
