import * as path from 'path';
import * as os from 'os';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { pathToFileURL } from 'url';

import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [
    BrokerModule,
    BullModule.registerQueue({
      name: 'market-data-download',
      processors: [
        {
          path: pathToFileURL(path.resolve(__dirname, './market-data.processor.js')),
          // 并发工作进程数量：优先取环境变量 DOWNLOAD_WORKERS，其次默认 3
          concurrency: Number(process.env.DOWNLOAD_WORKERS) || 3,
          useWorkerThreads: true,
        },
      ],
    }),
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
