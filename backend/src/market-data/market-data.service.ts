import type { BarData, ContractData } from '@vtrader/shared';

import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { Interval } from '@vtrader/shared';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { INTERVAL_VT2DAYJS } from '../broker-manager/brokers/binance-linear/constants';

export interface GetBarsParams {
  interval: Interval;
  startDate: string;
  endDate?: string;
  symbol: string;
  preload?: number;
  source: 'broker' | 'db';
}

export interface DownloadParams {
  startDate: string;
  endDate?: string;
  symbol: string;
  interval: Interval;
}

@Injectable()
export class MarketDataService {
  constructor(
    private prisma: PrismaService,
    private brokerMgr: BrokerManagerService,
  ) {}

  async getAllContracts(): Promise<ContractData[]> {
    const broker = await this.brokerMgr.getBroker();

    return broker.getAllContracts();
  }

  getBars(params: GetBarsParams): Promise<BarData[]> {
    if (params.source === 'broker') {
      return this.getBarsFromBroker(params);
    }
    return this.getBarsFromDb(params);
  }

  async getBarsFromBroker(params: Omit<GetBarsParams, 'source'>): Promise<BarData[]> {
    const { startDate, endDate, interval, symbol, preload } = params;
    let startTime = dayjs(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const broker = await this.brokerMgr.getBroker();

    if (preload) {
      const [n, unit] = INTERVAL_VT2DAYJS[interval];
      startTime = dayjs(startDate).subtract(preload * n, unit).format('YYYY-MM-DD HH:mm:ss');
    }

    return broker.queryHistory({
      startDate: startTime,
      endDate: endTime,
      interval,
      symbol,
    });
  }

  async getBarsFromDb(params: Omit<GetBarsParams, 'source'>): Promise<BarData[]> {
    const { startDate, endDate, interval, symbol, preload } = params;
    let startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();

    if (!interval) {
      throw new Error(`${interval}周期不能为空！`);
    }

    if (preload) {
      const [n, unit] = INTERVAL_VT2DAYJS[interval];
      startTime = dayjs(startTime).subtract(preload * n, unit).valueOf();
    }

    const bars = await this.prisma.bar.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
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

  async downloadBars(params: DownloadParams): Promise<number> {
    const { startDate, endDate, interval, symbol } = params;

    const bars = await this.getBarsFromBroker({
      startDate,
      endDate,
      interval,
      symbol,
    });

    const { count } = await this.prisma.bar.createMany({
      data: bars,
      skipDuplicates: true,
    });

    return count;
  }
}
