import { Controller, Post, Body } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { response } from '../utils';
import type { Response } from '../types/common';
import type { BrokerModel, BrokerType } from '../types/broker';
import type { Broker } from '../entities/broker.entity';
import { CreateBrokerDto, UpdateBrokerDto, RemoveBrokerDto } from './dto/broker-config.dto';

@Controller('broker-config')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  // 获取列表（不返回密钥）
  @Post('list')
  async list(): Promise<Response<BrokerModel[]>> {
    const configs = await this.brokerService.getAllConfigs();
    return response(configs);
  }

  // 新增
  @Post('create')
  async create(@Body() body: CreateBrokerDto): Promise<Response<Broker>> {
    const broker = await this.brokerService.create(body as { name: string; brokerType: BrokerType; apiKey: string; apiSecret: string; settings?: Record<string, any> });
    return response(broker);
  }

  // 更新（仅允许修改名称）
  @Post('update')
  async update(@Body() body: UpdateBrokerDto): Promise<Response<Broker>> {
    const broker = await this.brokerService.update(body.id, { name: body.name });
    return response(broker);
  }

  // 删除
  @Post('remove')
  async remove(@Body() body: RemoveBrokerDto): Promise<Response<void>> {
    await this.brokerService.remove(body.id);
    return response();
  }
}
