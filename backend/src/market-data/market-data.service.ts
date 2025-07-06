import type { GatewaySettings } from 'src/engine/gateways/binance-linear';
import type { BarData } from 'src/engine/types/common';

import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import BinanceLinearGateway from 'src/engine/gateways/binance-linear';
import { Interval } from 'src/engine/types/common';
import { PrismaService } from 'src/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  async downloadBars(params: DownloadParams): Promise<number> {
    const { start, end, interval, symbol } = params;

    const gateway = new BinanceLinearGateway();
    const settings: GatewaySettings = {
      apiKey: '1c5f9a2a4faefc20b1c0667cecef2ce8998f68133540b1c87a72886d6d3adac6',
      apiSecret: '3ca3aa8dd892bdecd473fa419fc50658826ff5a864c52956ad670652416a26de',
      server: 'TESTNET',
      klineStream: true,
      proxyHost: '127.0.0.1',
      proxyPort: 7890,
    };
    await gateway.connect(settings);

    const bars = await gateway.queryHistory({
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
