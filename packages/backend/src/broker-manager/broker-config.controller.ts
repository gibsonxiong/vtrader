import { Controller, Post, Body } from '@nestjs/common';
import { BrokerConfigService } from './broker-config.service';
import { response } from 'src/utils';
import type { Response } from 'src/types/common';
import type { BrokerConfig } from '../types/broker';
import type { BrokerType } from '../types/broker';
import type { Broker } from '../../generated/client';

@Controller('broker-config')
export class BrokerConfigController {
  constructor(private readonly configService: BrokerConfigService) {}

  // 获取列表（不返回密钥）
  @Post('list')
  async list(): Promise<Response<BrokerConfig[]>> {
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
  }  ): Promise<Response<Broker>> {
    const broker = await this.configService.create(body);
    return response(broker);
  }

  // 更新（仅允许修改名称）
  @Post('update')
  async update(@Body() body: {
    id: string;
    name: string;
  }): Promise<Response<Broker>> {
    const broker = await this.configService.update(body.id, { name: body.name });
    return response(broker);
  }

  // 删除
  @Post('remove')
  async remove(@Body() body: { id: string }): Promise<Response<void>> {
    await this.configService.remove(body.id);
    return response();
  }
}
