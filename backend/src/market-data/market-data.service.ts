import type { BarData } from 'src/engine/types/common';

import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Interval } from 'src/engine/types/common';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';

export interface GetBarsParams {
  end?: string;
  interval: Interval;
  start: string;
  symbol: string;
}

export interface DownloadParams {
  end?: string;
  interval: Interval;
  start: string;
  symbol: string;
}

@Injectable()
export class MarketDataService {
  constructor(
    private prisma: PrismaService,
    private brokerMgr: BrokerManagerService,
  ) {}

  async downloadBars(params: DownloadParams): Promise<number> {
    const { start, end, interval, symbol } = params;

    const broker = await this.brokerMgr.getBroker();

    const bars = await broker.queryHistory({
      start,
      end,
      interval,
      symbol,
    });

    const { count } = await this.prisma.bar.createMany({
      data: bars,
      skipDuplicates: true,
    });

    return count;
  }

  async getBars(params: GetBarsParams): Promise<BarData[]> {
    const { start, end, interval, symbol } = params;

    if (!interval) {
      throw new Error('{interval}周期不能为空！');
    }

    const bars = await this.prisma.bar.findMany({
      where: {
        timestamp: {
          gte: dayjs(start).valueOf(),
          lte: dayjs(end).valueOf(),
        },
        interval,
        symbol,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return bars.map((bar) => ({
      symbol: bar.symbol,
      timestamp: Number(bar.timestamp),
      interval: bar.interval as Interval,
      open: bar.open.toNumber(),
      high: bar.high.toNumber(),
      low: bar.low.toNumber(),
      close: bar.close.toNumber(),
      volume: bar.volume.toNumber(),
      openInterest: bar.openInterest?.toNumber(),
    }));
  }
}
