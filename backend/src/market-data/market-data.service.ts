import type { BarData, ContractData } from '@vtrader/shared';

import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { Interval } from '@vtrader/shared';
import { PrismaService } from 'src/prisma.service';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { INTERVAL_VT2DAYJS } from '../broker-manager/brokers/binance-linear/constants';

export interface GetAllContractsParams {
  brokerId: string;
}

export interface GetBarsParams {
  brokerId: string;
  interval: Interval;
  startDate: string;
  endDate?: string;
  symbol: string;
  preload?: number;
  source: 'broker' | 'db';
}

export interface DownloadParams {
  brokerId: string;
  symbol: string;
  interval: Interval;
  startDate: string;
  endDate?: string;
}

export interface BatchDownloadBarsParams {
  brokerId: string;
  symbols: string[];
  intervals: Interval[];
  startDate: string;
  endDate?: string;
}

@Injectable()
export class MarketDataService {
  constructor(
    private prisma: PrismaService,
    private brokerMgr: BrokerManagerService,
  ) {}

  async getAllContracts(params: GetAllContractsParams): Promise<ContractData[]> {
    const { brokerId } = params;
    const broker = await this.brokerMgr.getBroker(brokerId);

    return broker.getAllContracts();
  }

  getBars(params: GetBarsParams): Promise<BarData[]> {
    if (params.source === 'broker') {
      return this.getBarsFromBroker(params);
    }
    return this.getBarsFromDb(params);
  }

  async getBarsFromBroker(params: Omit<GetBarsParams, 'source'>): Promise<BarData[]> {
    const { brokerId, startDate, endDate, interval, symbol, preload } = params;
    let startTime = dayjs(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const broker = await this.brokerMgr.getBroker(brokerId);

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
    const { brokerId, startDate, endDate, interval, symbol, preload } = params;
    let startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();

    const brokerConfig = await this.brokerMgr.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

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
        brokerName: brokerConfig.brokerName,
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
    }));
  }

  async getBarOverview(params: {
    brokerId: string;
    symbol: string;
    interval: Interval;
  }) {
    const { brokerId, symbol, interval} = params;
    const brokerConfig = await this.brokerMgr.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const barOverviewItem = await this.prisma.barOverview.findFirst({
      where: {
        brokerName: brokerConfig.brokerName,
        symbol,
        interval
      }
    })

    return barOverviewItem;
  }

  async downloadBars(params: DownloadParams): Promise<number> {
    const { brokerId, startDate, endDate, interval, symbol } = params;
    const brokerConfig = await this.brokerMgr.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    const barOverview = await this.getBarOverview({
      brokerId,
      symbol,
      interval,
    });
    const ranges = (barOverview?.ranges || []) as [string, string][];

    // 如果之前下载过的日期就不下了，只下载没下载的
    // 计算需要下载的缺失区间
    const missingRanges = this.computeMissingRanges(
      ranges,
      startDate,
      endDate || dayjs().format('YYYY-MM-DD')
    );

    // 如果没有需要下载的区间，直接返回 0
    if (missingRanges.length === 0) {
      return 0;
    }

    let totalCount = 0;
    // 逐个区间下载
    for (const [rangeStart, rangeEnd] of missingRanges) {
      const bars = await this.getBarsFromBroker({
        brokerId,
        startDate: rangeStart,
        endDate: rangeEnd,
        interval,
        symbol,
      });

      const { count } = await this.prisma.bar.createMany({
        data: bars.map((bar) => ({
          ...bar,
          brokerName: brokerConfig.brokerName,
        })),
        skipDuplicates: true,
      });

      totalCount += count;
    }

    // 更新 barOverview
    const newRanges = this.mergeRanges([
      ...ranges,
      ...missingRanges,
    ]);

    if (!barOverview) {
      await this.prisma.barOverview.create({
        data: {
          brokerName: brokerConfig.brokerName,
          symbol,
          interval,
          ranges: newRanges,
        },
      });
    } else {
      await this.prisma.barOverview.update({
        where: { id: barOverview.id },
        data: { ranges: newRanges },
      });
    }

    return totalCount;
  }

    /**
   * 计算缺失的日期区间
   */
  private computeMissingRanges(
    existingRanges: [string, string][],
    startDate: string,
    endDate: string
  ): [string, string][] {
    if (existingRanges.length === 0) {
      return [[startDate, endDate]];
    }

    const missing: [string, string][] = [];
    let currentStart = dayjs(startDate);
    const end = dayjs(endDate);

    // 按开始时间排序
    const sorted = existingRanges
      .map(([s, e]) => [dayjs(s), dayjs(e)] as [dayjs.Dayjs, dayjs.Dayjs])
      .sort((a, b) => a[0].valueOf() - b[0].valueOf());

    for (const [exStart, exEnd] of sorted) {
      if (currentStart.isBefore(exStart)) {
        missing.push([
          currentStart.format('YYYY-MM-DD'),
          exStart.subtract(1, 'day').format('YYYY-MM-DD'),
        ]);
      }
      if (currentStart.isBefore(exEnd.add(1, 'day'))) {
        currentStart = exEnd.add(1, 'day');
      }
      if (currentStart.isAfter(end)) {
        break;
      }
    }

    if (currentStart.isSame(end) || currentStart.isBefore(end)) {
      missing.push([
        currentStart.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD'),
      ]);
    }

    return missing;
  }

  /**
   * 合并重叠或相邻的区间
   */
  private mergeRanges(ranges: [string, string][]): [string, string][] {
    if (ranges.length === 0) return [];

    const sorted = ranges
      .map(([s, e]) => [dayjs(s), dayjs(e)] as [dayjs.Dayjs, dayjs.Dayjs])
      .sort((a, b) => a[0].valueOf() - b[0].valueOf());

    const merged: [string, string][] = [];
    let [start, end] = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const [nextStart, nextEnd] = sorted[i];
      if (nextStart.isSame(end) || nextStart.isBefore(end)) {
        if (nextEnd.isAfter(end)) {
          end = nextEnd;
        }
      } else {
        merged.push([
          start.format('YYYY-MM-DD'),
          end.format('YYYY-MM-DD'),
        ]);
        start = nextStart;
        end = nextEnd;
      }
    }

    merged.push([
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD'),
    ]);

    return merged;
  }




  //   const bars = await this.getBarsFromBroker({
  //     brokerId,
  //     startDate,
  //     endDate,
  //     interval,
  //     symbol,
  //   });

  //   const { count } = await this.prisma.bar.createMany({
  //     data: bars.map((bar) => ({
  //       ...bar,
  //       brokerName: brokerConfig.brokerName,
  //     })),
  //     skipDuplicates: true,
  //   });

  //   // 保存baroverview
  //   if (!barOverview) {
  //     await this.prisma.barOverview.create({
  //       data: {
  //         brokerName: brokerConfig.brokerName,
  //         symbol,
  //         interval,
  //         ranges: [[startDate, endDate ? endDate : dayjs().format('YYYY-MM-DD')]] as [string, string][],
  //       }
  //     });
  //   }

  //   return count;
  // }

  // 批量下载
  async batchDownloadBars(params: BatchDownloadBarsParams): Promise<number> {
    const { brokerId, startDate, endDate, intervals, symbols } = params;

    // 组合遍历
    let allCount = 0;
    for (const symbol of symbols) {
      for (const interval of intervals) {
        const count = await this.downloadBars({
          brokerId,
          startDate,
          endDate,
          interval,
          symbol,
        });
        allCount += count;
      }
    }

    return allCount;
  }
}
