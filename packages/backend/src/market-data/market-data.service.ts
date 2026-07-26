import type { BarData, ContractData } from '@vtrader/shared';

import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { Interval } from '@vtrader/shared';
import { BrokerManagerService } from 'src/broker-manager/broker-manager.service';
import { INTERVAL_VT2DAYJS } from '../broker-manager/brokers/binance-linear';
import {
  deleteBarOverviewFiles,
  listBarOverviews,
  readBarOverview,
  readBars,
  writeBarOverview,
  writeBars,
  type BarOverviewRecord,
} from 'src/utils';
import type { BrokerType } from 'src/broker-manager/broker';

export interface GetAllContractsParams {
  brokerType: BrokerType;
}

export interface GetBarsParams {
  brokerId: string;
  interval: Interval;
  startDate: string;
  endDate?: string;
  symbol: string;
  preload?: number;
  source: 'broker' | 'db';
  currentPage?: number;
  pageSize?: number;
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

export interface DeleteBarOverviewParams {
  brokerName: string;
  symbol: string;
  interval: Interval;
}


function sortRanges(ranges: [string, string][]): [dayjs.Dayjs, dayjs.Dayjs][] {
  return ranges
    .map(([s, e]) => [dayjs(s), dayjs(e)] as [dayjs.Dayjs, dayjs.Dayjs])
    .sort((a, b) => a[0].valueOf() - b[0].valueOf());
}

function formatDate(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

// 计算补集
function calculateComplement(
  existingIntervals: [string, string][],
  targetInterval: [string, string]
): [string, string][] {
  const end = dayjs(targetInterval[1]);
  let currentStart = dayjs(targetInterval[0]);

  const sorted = sortRanges(existingIntervals);

  const complement: [string, string][] = [];

  for (const [exStart, exEnd] of sorted) {
    if (exEnd.isBefore(currentStart)) continue;
    if (exStart.isAfter(end)) break;

    if (currentStart.isBefore(exStart)) {
      const gapEnd = exStart.subtract(1, 'day');
      const clampedEnd = gapEnd.isAfter(end) ? end : gapEnd;
      if (currentStart.isSame(clampedEnd) || currentStart.isBefore(clampedEnd)) {
        complement.push([
          formatDate(currentStart),
          formatDate(clampedEnd),
        ]);
      }
    }

    const nextStart = exEnd.add(1, 'day');
    if (currentStart.isBefore(nextStart)) currentStart = nextStart;
    if (currentStart.isAfter(end)) break;
  }

  if (currentStart.isSame(end) || currentStart.isBefore(end)) {
    complement.push([
      formatDate(currentStart),
      formatDate(end),
    ]);
  }

  return complement;
}

// 计算并集
function calculateUnion(
  existingIntervals: [string, string][],
  newInterval: [string, string]
): [string, string][] {
  const ranges = [...existingIntervals, newInterval];
  if (ranges.length === 0) return [];

  const sorted = sortRanges(ranges);

  const merged: [string, string][] = [];
  let [start, end] = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const [nextStart, nextEnd] = sorted[i];
    const boundary = end.add(1, 'day');
    if (nextStart.isBefore(boundary) || nextStart.isSame(boundary)) {
      if (nextEnd.isAfter(end)) end = nextEnd;
    } else {
      merged.push([formatDate(start), formatDate(end)]);
      start = nextStart;
      end = nextEnd;
    }
  }

  merged.push([formatDate(start), formatDate(end)]);

  return merged;
}

// // 示例用法
// const existing = [['2025-10-10', '2025-10-18'], ['2025-11-01', '2025-11-28']] as [string, string][];
// const target = ['2025-10-01','2025-10-09'] as [string, string];
// console.log('######1', calculateComplement(existing, target));
// console.log('######2', calculateUnion(existing, target));

@Injectable()
export class MarketDataService {
  constructor(
    private brokerMgr: BrokerManagerService,
  ) {}

  async getAllContracts(params: GetAllContractsParams): Promise<ContractData[]> {
    const { brokerType } = params;
    const broker = await this.brokerMgr.getBrokerByType(brokerType as any);

    return broker.getAllContracts();
  }

  getBars(params: GetBarsParams): Promise<{ list: BarData[]; total: number }> {
    if (params.source === 'broker') {
      return this.getBarsFromBroker(params);
    }
    return this.getBarsFromDb(params);
  }

  async getBarsFromBroker(params: Omit<GetBarsParams, 'source'>): Promise<{ list: BarData[]; total: number }> {
    const { brokerId, startDate, endDate, interval, symbol, preload, currentPage, pageSize } = params;
    let startTime = dayjs(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const broker = await this.brokerMgr.getBroker(brokerId);

    if (preload) {
      const [n, unit] = INTERVAL_VT2DAYJS[interval];
      startTime = dayjs(startDate).subtract(preload * n, unit).format('YYYY-MM-DD HH:mm:ss');
    }

    const bars = await broker.queryHistory({
      startDate: startTime,
      endDate: endTime,
      interval,
      symbol,
    });
    const total = bars.length;
    let list = bars;
    if (currentPage && pageSize && currentPage > 0 && pageSize > 0) {
      const skip = (currentPage - 1) * pageSize;
      const end = skip + pageSize;
      list = bars.slice(skip, end);
    }
    return { list, total };
  }

  async getBarsFromDb(params: Omit<GetBarsParams, 'source'>): Promise<{ list: BarData[]; total: number }> {
    const { brokerId, startDate, endDate, interval, symbol, preload, currentPage, pageSize } = params;
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

    // const pagination: { skip?: number; take?: number } = {};
    // if (currentPage && pageSize && currentPage > 0 && pageSize > 0) {
    //   pagination.skip = (currentPage - 1) * pageSize;
    //   pagination.take = pageSize;
    // }

    // const where = {
    //   timestamp: {
    //     gte: startTime,
    //     lte: endTime,
    //   },
    //   brokerName: brokerConfig.brokerName,
    //   interval,
    //   symbol,
    // };

    // const total = await this.prisma.bar.count({ where });

    // const bars = await this.prisma.bar.findMany({
    //   select: {
    //     timestamp: true,
    //     open: true,
    //     high: true,
    //     low: true,
    //     close: true,
    //     volume: true,
    //   },
    //   where,
    //   orderBy: {
    //     timestamp: 'desc',
    //   },
    //   ...pagination,
    // });
    // const list = bars.map((bar) => ({
    //   symbol: symbol,
    //   interval: interval,
    //   timestamp: Number(bar.timestamp),
    //   open: bar.open.toNumber(),
    //   high: bar.high.toNumber(),
    //   low: bar.low.toNumber(),
    //   close: bar.close.toNumber(),
    //   volume: bar.volume.toNumber(),
    // }));

    let bars = await readBars(brokerConfig.brokerType, symbol, interval, startTime, endTime);
    const total = bars.length;

    if (currentPage && pageSize && currentPage > 0 && pageSize > 0) {
      const skip = (currentPage - 1) * pageSize;
      const end = skip + pageSize;
      bars = bars.slice(skip, end);
    }

    return { 
      list: bars,
      total,
    };
  }

  async getBarOverview(params: {
    brokerId: string;
    symbol: string;
    interval: Interval;
  }): Promise<BarOverviewRecord | null> {
    const { brokerId, symbol, interval} = params;
    const brokerConfig = await this.brokerMgr.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    return readBarOverview(brokerConfig.brokerType, symbol, interval);
  }

  async getBarOverviews(): Promise<BarOverviewRecord[]> {
    return listBarOverviews();
  }

  async deleteBarOverview(params: DeleteBarOverviewParams): Promise<DeleteBarOverviewParams> {
    const { brokerName, symbol, interval } = params;
    deleteBarOverviewFiles(brokerName, symbol, interval);
    return { brokerName, symbol, interval };
  }

  async downloadBars(params: DownloadParams): Promise<number> {
    let { endDate } = params;
    const { brokerId, startDate, interval, symbol } = params;
    const brokerConfig = await this.brokerMgr.getBrokerConfig(brokerId);

    if (!brokerConfig) {
      throw new Error(`未找到id为[${brokerId}]的broker`);
    }

    endDate = endDate ?? formatDate(dayjs());

    const barOverview = await this.getBarOverview({
      brokerId,
      symbol,
      interval,
    });
    const ranges = (barOverview?.ranges || []) as [string, string][];

    // 如果之前下载过的日期就不下了，只下载没下载的
    // 计算需要下载的缺失区间
    const missingRanges = calculateComplement(
      ranges,
      [startDate, endDate]
    );

    // 如果没有需要下载的区间，直接返回 0
    if (missingRanges.length === 0) {
      return 0;
    }

    let totalCount = 0;
    let totalBars = barOverview?.count ?? 0;
    // 逐个区间下载
    for (const [rangeStart, rangeEnd] of missingRanges) {
      const bars = await this.getBarsFromBroker({
        brokerId,
        startDate: rangeStart,
        endDate: rangeEnd,
        interval,
        symbol,
      });

      // const { count } = await this.prisma.bar.createMany({
      //   data: bars.list.map((bar) => ({
      //     ...bar,
      //     brokerName: brokerConfig.brokerName,
      //   })),
      //   skipDuplicates: true,
      // });

      // 写入文件
      const { count, total } = await writeBars(brokerConfig.brokerType, symbol, interval, bars.list);

      totalCount += count;
      totalBars = total;
    }

    // 更新 barOverview
    const newRanges = calculateUnion(
      ranges,
      [startDate, endDate]
    );

    writeBarOverview({
      version: 1,
      brokerType: brokerConfig.brokerType,
      symbol,
      interval,
      ranges: newRanges,
      updatedAt: new Date().toISOString(),
      count: totalBars,
    });

    return totalCount;
  }

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
