import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Broker } from '../entities/broker.entity';
import { BrokerManagerService } from './broker-manager.service';
import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Broker])],
  controllers: [BrokerController],
  providers: [BrokerManagerService, BrokerService],
  exports: [BrokerManagerService, BrokerService],
})
export class BrokerModule {}
